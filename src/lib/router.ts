/**
 * The fee router. Pure-ish functions used by the worker (scripts/worker.ts)
 * and by demo-mode simulation:
 *
 *   1. attributeClaim()  — split a claimed lump of creator fees across the
 *                          tokens that generated them (pro-rata by traded
 *                          volume since the last claim) and credit each
 *                          recipient handle with their share.
 *   2. runPayouts()      — pay any creator whose unpaid balance crossed the
 *                          next milestone and who has linked a wallet.
 */
import { config, isDemoMode } from "./config";
import {
  balanceForHandle,
  getCreatorByHandle,
  getToken,
  handlesWithUnpaidBalance,
  insertClaim,
  insertLedger,
  insertPayout,
  listPayoutsForHandle,
  markTradesAttributed,
  unattributedVolumeByMint,
} from "./db";
import { lamportsToCents, solUsd } from "./price";
import { sendSol } from "./solana";

/** Next milestone (cents) after `paidCents` has already been paid out. */
export function nextMilestoneCents(paidCents: number): number {
  for (const m of config.milestonesCents) if (m > paidCents) return m;
  const last = config.milestonesCents[config.milestonesCents.length - 1];
  const steps = Math.floor((paidCents - last) / config.milestoneStepCents) + 1;
  return last + steps * config.milestoneStepCents;
}

/**
 * Credit `lamports` (already claimed to the treasury in tx `sig`) to the
 * recipients of every token, weighted by unattributed trade volume.
 * Tokens without recorded volume get nothing; if no volume was recorded at all,
 * the claim is parked under the protocol account so nothing is lost.
 */
export async function attributeClaim(sig: string, lamports: number) {
  insertClaim(sig, lamports);
  if (lamports <= 0) return { credited: 0 };
  const usd = await solUsd();
  const vols = unattributedVolumeByMint().filter((v) => getToken(v.mint)?.status === "live");
  const total = vols.reduce((a, v) => a + v.vol, 0);
  const now = Date.now();
  let credited = 0;

  if (total === 0) {
    insertLedger({ handle: "__protocol__", mint: null, kind: "protocol", lamports, usd_cents: lamportsToCents(lamports, usd), ref: sig, ts: now });
    return { credited };
  }

  for (const v of vols) {
    const t = getToken(v.mint)!;
    const share = Math.floor((lamports * v.vol) / total);
    const toCreator = Math.floor((share * config.creatorShareBps) / 10_000);
    const toProtocol = share - toCreator;
    if (toCreator > 0) {
      insertLedger({ handle: t.recipient_handle, mint: v.mint, kind: "credit", lamports: toCreator, usd_cents: lamportsToCents(toCreator, usd), ref: sig, ts: now });
      credited += toCreator;
    }
    if (toProtocol > 0) {
      insertLedger({ handle: "__protocol__", mint: v.mint, kind: "protocol", lamports: toProtocol, usd_cents: lamportsToCents(toProtocol, usd), ref: sig, ts: now });
    }
  }
  markTradesAttributed();
  return { credited };
}

export interface PayoutResult {
  handle: string;
  lamports: number;
  usd_cents: number;
  sig: string;
}

/** Pay every creator who (a) linked a wallet and (b) crossed their next milestone. */
export async function runPayouts(log: (s: string) => void = () => {}): Promise<PayoutResult[]> {
  const results: PayoutResult[] = [];
  const usd = await solUsd();
  for (const row of handlesWithUnpaidBalance()) {
    if (row.handle.startsWith("__")) continue;
    const creator = getCreatorByHandle(row.handle);
    if (!creator?.payout_wallet) continue;
    const bal = balanceForHandle(row.handle);
    const milestone = nextMilestoneCents(bal.paid_cents);
    // Value the unpaid lamports at today's price for the milestone check.
    const unpaidCentsNow = lamportsToCents(bal.unpaid_lamports, usd);
    if (bal.paid_cents + unpaidCentsNow < milestone) continue;

    const lamports = bal.unpaid_lamports;
    let sig: string;
    if (isDemoMode()) {
      sig = `demo-payout-${row.handle}-${Date.now()}`;
    } else {
      sig = await sendSol(creator.payout_wallet, lamports, `TikPad payout to @${row.handle}`);
    }
    insertPayout({ handle: row.handle, wallet: creator.payout_wallet, lamports, usd_cents: unpaidCentsNow, sig, milestone_cents: milestone, demo: isDemoMode() ? 1 : 0 });
    log(`paid @${row.handle} ${lamports / 1e9} SOL (${(unpaidCentsNow / 100).toFixed(2)} USD) -> ${creator.payout_wallet} [${sig}]`);
    results.push({ handle: row.handle, lamports, usd_cents: unpaidCentsNow, sig });
  }
  return results;
}

export const previousPayouts = (handle: string) => listPayoutsForHandle(handle);
