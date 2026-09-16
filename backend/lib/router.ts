/**
 * The fee router. Used by the worker (scripts/worker.ts), the Vercel cron
 * route (/api/cron/router) and demo-mode simulation:
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
  batch,
  getCreatorByHandle,
  getToken,
  handlesWithUnpaidBalance,
  insertClaim,
  insertTrade,
  ledgerStmt,
  listTokens,
  markTradesAttributed,
  payoutStmts,
  unattributedVolumeByMint,
} from "./db";
import { collectCreatorFees } from "./pumpportal";
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
 * If no volume was recorded at all, the claim is parked under the protocol
 * account so nothing is lost.
 */
export async function attributeClaim(sig: string, lamports: number) {
  if ((await insertClaim(sig, lamports)) === 0) return { credited: 0, duplicate: true };
  if (lamports <= 0) return { credited: 0 };
  const usd = await solUsd();
  const raw = await unattributedVolumeByMint();
  const vols: { mint: string; vol: number; handle: string }[] = [];
  for (const v of raw) {
    const t = await getToken(v.mint);
    if (t?.status === "live") vols.push({ ...v, handle: t.recipient_handle });
  }
  const total = vols.reduce((a, v) => a + v.vol, 0);
  const now = Date.now();
  let credited = 0;

  if (total === 0) {
    await batch([ledgerStmt({ handle: "__protocol__", mint: null, kind: "protocol", lamports, usd_cents: lamportsToCents(lamports, usd), ref: sig, ts: now })]);
    return { credited };
  }

  const stmts = [];
  for (const v of vols) {
    const share = Math.floor((lamports * v.vol) / total);
    const toCreator = Math.floor((share * config.creatorShareBps) / 10_000);
    const toProtocol = share - toCreator;
    if (toCreator > 0) {
      stmts.push(ledgerStmt({ handle: v.handle, mint: v.mint, kind: "credit", lamports: toCreator, usd_cents: lamportsToCents(toCreator, usd), ref: sig, ts: now }));
      credited += toCreator;
    }
    if (toProtocol > 0) {
      stmts.push(ledgerStmt({ handle: "__protocol__", mint: v.mint, kind: "protocol", lamports: toProtocol, usd_cents: lamportsToCents(toProtocol, usd), ref: sig, ts: now }));
    }
  }
  await batch(stmts);
  await markTradesAttributed();
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
  for (const row of await handlesWithUnpaidBalance()) {
    if (row.handle.startsWith("__")) continue;
    const creator = await getCreatorByHandle(row.handle);
    if (!creator?.payout_wallet) continue;
    const bal = await balanceForHandle(row.handle);
    const milestone = nextMilestoneCents(bal.paid_cents);
    // Value the unpaid lamports at today's price for the milestone check.
    const unpaidCentsNow = lamportsToCents(bal.unpaid_lamports, usd);
    if (bal.paid_cents + unpaidCentsNow < milestone) continue;

    const lamports = bal.unpaid_lamports;
    const sig = isDemoMode() ? `demo-payout-${row.handle}-${Date.now()}` : await sendSol(creator.payout_wallet, lamports, `TikPad payout to @${row.handle}`);
    await batch(payoutStmts({ handle: row.handle, wallet: creator.payout_wallet, lamports, usd_cents: unpaidCentsNow, sig, milestone_cents: milestone, demo: isDemoMode() ? 1 : 0 }));
    log(`paid @${row.handle} ${lamports / 1e9} SOL (${(unpaidCentsNow / 100).toFixed(2)} USD) -> ${creator.payout_wallet} [${sig}]`);
    results.push({ handle: row.handle, lamports, usd_cents: unpaidCentsNow, sig });
  }
  return results;
}

/** One full router cycle: claim → attribute → pay. Used by the worker and the cron route. */
export async function runCycle(log: (s: string) => void = () => {}) {
  if (isDemoMode()) {
    const r = await simulateDemoClaim();
    if (r) log(`[demo] simulated claim of ${r.lamports / 1e9} SOL, credited ${r.credited / 1e9} SOL`);
  } else {
    const { signature, lamports } = await collectCreatorFees();
    log(`claimed ${lamports / 1e9} SOL creator fees in ${signature}`);
    const r = await attributeClaim(signature, lamports);
    log(`credited ${r.credited / 1e9} SOL to creators`);
  }
  const paid = await runPayouts(log);
  if (paid.length) log(`sent ${paid.length} payout(s)`);
  return paid;
}

/** Demo only: pretend a claim happened and spread it over a random live token. */
export async function simulateDemoClaim() {
  const tokens = await listTokens(50);
  if (tokens.length === 0) return null;
  const t = tokens[Math.floor(Math.random() * tokens.length)];
  const lamports = Math.round((0.01 + Math.random() * 0.2) * 1e9);
  await insertTrade({ mint: t.mint, sig: `demo-trade-${Date.now()}`, side: "buy", sol_lamports: lamports * 300, trader: null, ts: Date.now() });
  const r = await attributeClaim(`demo-claim-${Date.now()}`, lamports);
  return { lamports, credited: r.credited };
}
