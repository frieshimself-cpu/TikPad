/**
 * PumpPortal local-transaction API + Pinata IPFS uploads.
 * Docs: https://pumpportal.fun/creation/  https://pumpportal.fun/creator-fee/
 */
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { serverConfig } from "./config";
import { connection, treasuryKeypair } from "./solana";

const TRADE_LOCAL = "https://pumpportal.fun/api/trade-local";
const PINATA_UPLOAD = "https://uploads.pinata.cloud/v3/files";

async function pinataUpload(file: Blob, filename: string): Promise<string> {
  if (!serverConfig.pinataJwt) throw new Error("PINATA_JWT is not set");
  const form = new FormData();
  form.append("file", file, filename);
  form.append("network", "public");
  const res = await fetch(PINATA_UPLOAD, { method: "POST", headers: { Authorization: `Bearer ${serverConfig.pinataJwt}` }, body: form });
  const json = (await res.json()) as { data?: { cid?: string }; error?: unknown };
  if (!res.ok || !json.data?.cid) throw new Error(`IPFS upload failed (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  return `${serverConfig.pinataGateway.replace(/\/$/, "")}/ipfs/${json.data.cid}`;
}

export interface TokenMeta {
  name: string;
  symbol: string;
  description: string;
  image: Blob;
  imageName: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export async function uploadMetadata(meta: TokenMeta) {
  const imageUrl = await pinataUpload(meta.image, meta.imageName);
  const json = {
    name: meta.name,
    symbol: meta.symbol,
    description: meta.description,
    image: imageUrl,
    showName: true,
    createdOn: "https://pump.fun",
    ...(meta.twitter ? { twitter: meta.twitter } : {}),
    ...(meta.telegram ? { telegram: meta.telegram } : {}),
    ...(meta.website ? { website: meta.website } : {}),
  };
  const metadataUri = await pinataUpload(new Blob([JSON.stringify(json)], { type: "application/json" }), "metadata.json");
  return { imageUrl, metadataUri };
}

async function tradeLocal(body: Record<string, unknown>): Promise<VersionedTransaction> {
  const res = await fetch(TRADE_LOCAL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PumpPortal ${res.status}: ${await res.text()}`);
  return VersionedTransaction.deserialize(new Uint8Array(await res.arrayBuffer()));
}

async function sendAndConfirm(tx: VersionedTransaction) {
  const c = connection();
  const signature = await c.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  const latest = await c.getLatestBlockhash();
  await c.confirmTransaction({ signature, ...latest }, "confirmed");
  return signature;
}

/**
 * Create a pump.fun coin. The treasury signs as `publicKey`, which makes it the
 * on-chain creator: 100% of creator rewards accrue to it. Optional dev buy.
 */
export async function createToken(opts: { name: string; symbol: string; metadataUri: string; devBuySol: number }) {
  const treasury = treasuryKeypair();
  const mintKeypair = Keypair.generate();
  const tx = await tradeLocal({
    publicKey: treasury.publicKey.toBase58(),
    action: "create",
    tokenMetadata: { name: opts.name, symbol: opts.symbol, uri: opts.metadataUri },
    mint: mintKeypair.publicKey.toBase58(),
    denominatedInSol: "true",
    amount: opts.devBuySol,
    slippage: serverConfig.slippagePct,
    priorityFee: serverConfig.priorityFeeSol,
    pool: "pump",
  });
  tx.sign([mintKeypair, treasury]);
  const signature = await sendAndConfirm(tx);
  return { mint: mintKeypair.publicKey.toBase58(), signature };
}

/**
 * Claim all pending creator rewards for the treasury, across every coin it
 * created (bonding curve and PumpSwap). PumpPortal returns a transaction even
 * when nothing is owed, so we simulate first and treat a failed simulation as
 * "nothing to claim". Returns null in that case, or when the treasury cannot
 * pay the network fee.
 */
export async function collectCreatorFees(log: (s: string) => void = () => {}): Promise<{ signature: string; lamports: number } | null> {
  const treasury = treasuryKeypair();
  const c = connection();
  const before = await c.getBalance(treasury.publicKey, "confirmed");
  if (before < 0.001 * 1e9) {
    log(`treasury has ${before / 1e9} SOL, not enough to pay a claim fee; skipping`);
    return null;
  }
  const tx = await tradeLocal({ publicKey: treasury.publicKey.toBase58(), action: "collectCreatorFee", priorityFee: serverConfig.priorityFeeSol });
  tx.sign([treasury]);
  const sim = await c.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true });
  if (sim.value.err) {
    const logs = (sim.value.logs ?? []).filter((l) => /error|fail|insufficient/i.test(l)).slice(-2).join(" | ");
    log(`nothing to claim (${JSON.stringify(sim.value.err)}${logs ? `: ${logs}` : ""})`);
    return null;
  }
  const signature = await sendAndConfirm(tx);
  const after = await c.getBalance(treasury.publicKey, "confirmed");
  return { signature, lamports: after - before };
}

export const pumpUrl = (mint: string) => `https://pump.fun/coin/${mint}`;
