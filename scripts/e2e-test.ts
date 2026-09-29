/**
 * End-to-end test of the real launch flow through the HTTP API, exactly as the
 * browser does it: quote → pay the treasury on chain → POST /api/launch.
 * Creates a fresh launcher wallet, funds it from the treasury, and launches from
 * it, so the payment and the dev-buy sweep cross wallets like a real user's do.
 * Spends real SOL.
 *
 *   npx tsx scripts/e2e-test.ts http://localhost:3000
 */
import "dotenv/config";
import { appendFileSync, readFileSync } from "node:fs";
import bs58 from "bs58";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { treasuryKeypair, MEMO_PROGRAM_ID } from "../src/lib/server/solana";
import { serverConfig } from "../src/lib/server/config";

const base = process.argv[2] ?? "http://localhost:3000";

async function send(c: Connection, tx: Transaction, signer: Keypair) {
  // Finalized blockhash: the public RPC is load balanced and a "confirmed" hash may not be visible to the preflight node yet.
  const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash("finalized");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signer.publicKey;
  tx.sign(signer);
  try {
    const sig = await c.sendRawTransaction(tx.serialize(), { maxRetries: 5, preflightCommitment: "confirmed" });
    await c.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    return sig;
  } catch (e) {
    const logs = typeof (e as { getLogs?: unknown }).getLogs === "function" ? await (e as { getLogs: (c: Connection) => Promise<string[]> }).getLogs(c) : [];
    throw new Error(`${(e as Error).message}\nlogs: ${JSON.stringify(logs)}`);
  }
}

async function main() {
  const treasury = treasuryKeypair();
  const c = new Connection(serverConfig.rpcUrl, "confirmed");
  console.log("treasury balance:", (await c.getBalance(treasury.publicKey)) / 1e9, "SOL");

  // 0. fresh launcher wallet, funded by the treasury
  const kp = Keypair.generate();
  const wallet = kp.publicKey.toBase58();
  appendFileSync(".e2e-wallets.txt", `${new Date().toISOString()} ${wallet} ${bs58.encode(kp.secretKey)}\n`); // git-ignored; lets us recover leftovers
  const fundSig = await send(c, new Transaction().add(SystemProgram.transfer({ fromPubkey: treasury.publicKey, toPubkey: kp.publicKey, lamports: 45_000_000 })), treasury);
  console.log("launcher:", wallet, "funded 0.045 SOL in", fundSig);

  // 1. quote
  const qr = await fetch(`${base}/api/launch/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet, devBuySol: 0.005 }) });
  const q = (await qr.json()) as { id: string; memo: string; treasury: string; total_lamports: number; error?: string };
  if (!qr.ok) throw new Error("quote failed: " + q.error);
  console.log("quote ok, memo", q.memo, "total", q.total_lamports / 1e9, "SOL");

  // 2. pay (browser does exactly this with the user's wallet)
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: new PublicKey(q.treasury), lamports: q.total_lamports }),
    new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(q.memo, "utf8") }),
  );
  const paymentSig = await send(c, tx, kp);
  console.log("payment confirmed:", paymentSig);

  // 3. launch via the API
  const fd = new FormData();
  fd.set("quoteId", q.id);
  fd.set("paymentSig", paymentSig);
  fd.set("name", "AdPad E2E");
  fd.set("symbol", "HUSHE2E");
  fd.set("description", "End-to-end test of the AdPad launch flow.");
  fd.set("handle", "adpad");
  fd.set("wallet", wallet);
  fd.set("image", new Blob([readFileSync("public/meta/fptest.png")], { type: "image/png" }), "coin.png");
  const lr = await fetch(`${base}/api/launch`, { method: "POST", body: fd });
  const res = (await lr.json()) as { mint?: string; signature?: string; sweepSig?: string | null; error?: string };
  if (!lr.ok) throw new Error("launch failed: " + res.error);
  console.log("LAUNCHED mint:", res.mint);
  console.log("  create tx: https://solscan.io/tx/" + res.signature);
  console.log("  sweep tx:  " + (res.sweepSig ? "https://solscan.io/tx/" + res.sweepSig : "n/a"));
  console.log("  pump.fun:  https://pump.fun/coin/" + res.mint);

  // 4. verify creator on pump.fun
  const info = (await (await fetch(`https://frontend-api-v3.pump.fun/coins/${res.mint}`)).json()) as { creator?: string; name?: string; description?: string };
  console.log("pump.fun creator:", info.creator, info.creator === wallet ? "(treasury ✓)" : "(MISMATCH!)");
  console.log("pump.fun description:", JSON.stringify(info.description));

  // 5. launcher's token balance (dev buy should have been swept here)
  const tokens = await c.getParsedTokenAccountsByOwner(kp.publicKey, { mint: new PublicKey(res.mint!) });
  const amt = tokens.value[0]?.account.data.parsed.info.tokenAmount.uiAmountString ?? "0";
  console.log("launcher token balance:", amt, "HUSHE2E", Number(amt) > 0 ? "(sweep ✓)" : "(sweep pending/failed)");

  // 6. refund the launcher's leftover SOL to the treasury
  const left = await c.getBalance(kp.publicKey);
  const refund = left - 5_000;
  if (refund > 0) {
    const sig = await send(c, new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: treasury.publicKey, lamports: refund })), kp);
    console.log("refunded", refund / 1e9, "SOL to treasury in", sig);
  }
  console.log("treasury balance now:", (await c.getBalance(treasury.publicKey)) / 1e9, "SOL");
  process.exit(0);
}
main().catch((e) => { console.error("E2E FAILED:", e instanceof Error ? e.message : e); process.exit(1); });
