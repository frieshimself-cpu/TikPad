/**
 * Demo-mode data. Seeds a believable activity history so the product can be
 * explored without a treasury, RPC or TikTok credentials.
 */
import type { InStatement } from "@libsql/client";
import { Keypair } from "@solana/web3.js";
import { feeTag } from "./config";
import { batch, getMeta, insertTokenStmt, ledgerStmt, payoutStmts, upsertCreatorStmt } from "./db";

const seedCreators = [
  { handle: "khaby.lame", name: "Khaby Lame" },
  { handle: "charlidamelio", name: "charli d'amelio" },
  { handle: "mrbeast", name: "MrBeast" },
  { handle: "bellapoarch", name: "Bella Poarch" },
  { handle: "zachking", name: "Zach King" },
  { handle: "addisonre", name: "Addison Rae" },
  { handle: "spencerx", name: "Spencer X" },
  { handle: "gordonramsayofficial", name: "Gordon Ramsay" },
];

const seedTokens = [
  { name: "Khaby Coin", symbol: "KHABY", handle: "khaby.lame" },
  { name: "Charli", symbol: "CHARLI", handle: "charlidamelio" },
  { name: "Beast Mode", symbol: "BEAST", handle: "mrbeast" },
  { name: "Build a B", symbol: "BELLA", handle: "bellapoarch" },
  { name: "Zach Magic", symbol: "MAGIC", handle: "zachking" },
  { name: "Addison", symbol: "ADDI", handle: "addisonre" },
  { name: "Beatbox", symbol: "BEAT", handle: "spencerx" },
  { name: "Idiot Sandwich", symbol: "RAMSAY", handle: "gordonramsayofficial" },
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

let seeding: Promise<void> | null = null;

export function seedDemoData(): Promise<void> {
  if (!seeding) seeding = doSeed();
  return seeding;
}

async function doSeed() {
  if (await getMeta("demo_seeded")) return;
  const rand = rng(42);
  const SOL_USD = 150;
  const now = Date.now();
  const stmts: InStatement[] = [];
  for (const c of seedCreators) stmts.push(upsertCreatorStmt({ handle: c.handle, display_name: c.name }));
  seedTokens.forEach((t, i) => {
    const mint = Keypair.generate().publicKey.toBase58();
    const created = now - (seedTokens.length - i) * 6 * 3600_000 - rand() * 3600_000;
    stmts.push(
      insertTokenStmt({
        mint,
        name: t.name,
        symbol: t.symbol,
        description: `${t.name} — community token.\n\n${feeTag(t.handle)}`,
        image_url: null,
        metadata_uri: null,
        recipient_handle: t.handle,
        launcher_wallet: Keypair.generate().publicKey.toBase58(),
        dev_buy_lamports: Math.round((0.2 + rand() * 1.5) * 1e9),
        create_sig: `demo-${i}`,
        status: "live",
        demo: 1,
        created_at: created,
      }),
    );
    const n = 3 + Math.floor(rand() * 6);
    let cum = 0;
    for (let k = 0; k < n; k++) {
      const lamports = Math.round((0.02 + rand() * 0.6) * 1e9);
      cum += lamports;
      stmts.push(
        ledgerStmt({
          handle: t.handle,
          mint,
          kind: "credit",
          lamports,
          usd_cents: Math.round((lamports / 1e9) * SOL_USD * 100),
          ref: `demo-claim-${i}-${k}`,
          ts: Math.round(created + ((k + 1) * (now - created)) / (n + 1)),
        }),
      );
    }
    if (rand() > 0.35) {
      const lamports = Math.round(cum * (0.5 + rand() * 0.4));
      stmts.push(
        ...payoutStmts({
          handle: t.handle,
          wallet: Keypair.generate().publicKey.toBase58(),
          lamports,
          usd_cents: Math.round((lamports / 1e9) * SOL_USD * 100),
          sig: `demo-payout-${i}`,
          milestone_cents: 500,
          demo: 1,
          ts: Math.round(now - rand() * 5 * 3600_000),
        }),
      );
    }
  });
  stmts.push({ sql: "INSERT OR IGNORE INTO meta(key,value) VALUES('demo_seeded','1')", args: [] });
  await batch(stmts);
}
