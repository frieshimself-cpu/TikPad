/**
 * PumpPortal "local transaction" API client + Pinata IPFS uploads.
 * Docs: https://pumpportal.fun/creation/  https://pumpportal.fun/creator-fee/
 */
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { config } from "./config";
import { connection, treasuryKeypair } from "./solana";

const TRADE_LOCAL = "https://pumpportal.fun/api/trade-local";
const PINATA_UPLOAD = "https://uploads.pinata.cloud/v3/files";

async function pinataUpload(file: Blob, filename: string): Promise<string> {
  if (!config.pinataJwt) throw new Error("PINATA_JWT is not set");
  const form = new FormData();
  form.append("file", file, filename);
  form.append("network", "public");
  const res = await fetch(PINATA_UPLOAD, { method: "POST", headers: { Authorization: `Bearer ${config.pinataJwt}` }, body: form });
  const json = (await res.json()) as { data?: { cid?: string }; error?: unknown };
  if (!res.ok || !json.data?.cid) throw new Error(`IPFS upload failed (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  return `${config.pinataGateway.replace(/\/$/, "")}/ipfs/${json.data.cid}`;
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

/** Uploads the image then the metadata JSON. Returns { imageUrl, metadataUri }. */
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
  if (!res.ok) throw new Error(`PumpPortal error ${res.status}: ${await res.text()}`);
  return VersionedTransaction.deserialize(new Uint8Array(await res.arrayBuffer()));
}

/**
 * Create a pump.fun token with the treasury as creator (so creator fees accrue
 * to the treasury) and an optional dev buy. Returns { mint, signature }.
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
    slippage: 10,
    priorityFee: config.priorityFeeSol,
    pool: "pump",
  });
  tx.sign([mintKeypair, treasury]);
  const c = connection();
  const signature = await c.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  const latest = await c.getLatestBlockhash();
  await c.confirmTransaction({ signature, ...latest }, "confirmed");
  return { mint: mintKeypair.publicKey.toBase58(), signature };
}

/** Claim all pending creator fees for the treasury wallet. Returns { signature, lamports } (lamports = balance delta). */
export async function collectCreatorFees() {
  const treasury = treasuryKeypair();
  const c = connection();
  const before = await c.getBalance(treasury.publicKey, "confirmed");
  const tx = await tradeLocal({ publicKey: treasury.publicKey.toBase58(), action: "collectCreatorFee", priorityFee: config.priorityFeeSol });
  tx.sign([treasury]);
  const signature = await c.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  const latest = await c.getLatestBlockhash();
  await c.confirmTransaction({ signature, ...latest }, "confirmed");
  const after = await c.getBalance(treasury.publicKey, "confirmed");
  return { signature, lamports: Math.max(0, after - before) };
}

export const pumpUrl = (mint: string) => `https://pump.fun/coin/${mint}`;
export const solscanTx = (sig: string) => `https://solscan.io/tx/${sig}`;
export const solscanAccount = (a: string) => `https://solscan.io/account/${a}`;
