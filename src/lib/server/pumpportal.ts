/**
 * PumpPortal local-transaction API (builds an unsigned pump.fun create
 * transaction for the launcher's own wallet) and token metadata uploads.
 * Docs: https://pumpportal.fun/creation/
 */
import { VersionedTransaction } from "@solana/web3.js";
import { serverConfig } from "./config";

const TRADE_LOCAL = "https://pumpportal.fun/api/trade-local";
const PINATA_UPLOAD = "https://uploads.pinata.cloud/v3/files";
const PUMP_IPFS = "https://pump.fun/api/ipfs";

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

/** pump.fun's own metadata uploader. No key needed. */
export async function pumpIpfsUpload(meta: TokenMeta) {
  const form = new FormData();
  form.append("file", meta.image, meta.imageName);
  form.append("name", meta.name);
  form.append("symbol", meta.symbol);
  form.append("description", meta.description);
  form.append("showName", "true");
  if (meta.twitter) form.append("twitter", meta.twitter);
  if (meta.telegram) form.append("telegram", meta.telegram);
  if (meta.website) form.append("website", meta.website);
  const res = await fetch(PUMP_IPFS, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { metadataUri?: string; metadata?: { image?: string } };
  if (!res.ok || !json.metadataUri) throw new Error(`pump.fun metadata upload failed (${res.status})`);
  return { imageUrl: json.metadata?.image ?? null, metadataUri: json.metadataUri };
}

async function pinataUpload(file: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("network", "public");
  const res = await fetch(PINATA_UPLOAD, { method: "POST", headers: { Authorization: `Bearer ${serverConfig.pinataJwt}` }, body: form });
  const json = (await res.json()) as { data?: { cid?: string }; error?: unknown };
  if (!res.ok || !json.data?.cid) throw new Error(`IPFS upload failed (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  return `${serverConfig.pinataGateway.replace(/\/$/, "")}/ipfs/${json.data.cid}`;
}

export function buildMetadataJson(meta: Omit<TokenMeta, "image" | "imageName">, imageUrl: string) {
  return {
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
}

/** Pinata-hosted image + metadata (when PINATA_JWT is set). */
export async function uploadMetadata(meta: TokenMeta) {
  const imageUrl = await pinataUpload(meta.image, meta.imageName);
  const json = buildMetadataJson(meta, imageUrl);
  const metadataUri = await pinataUpload(new Blob([JSON.stringify(json)], { type: "application/json" }), "metadata.json");
  return { imageUrl, metadataUri };
}

/**
 * Ask PumpPortal for a pump.fun "create" transaction that `wallet` pays for and
 * signs. The wallet becomes the coin's on-chain creator; `mint` is the public
 * key of a keypair the launcher holds (it must co-sign). Returns the unsigned
 * transaction, base64-encoded.
 */
export async function buildCreateTx(opts: { wallet: string; mint: string; name: string; symbol: string; metadataUri: string; devBuySol: number }) {
  const res = await fetch(TRADE_LOCAL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: opts.wallet,
      action: "create",
      tokenMetadata: { name: opts.name, symbol: opts.symbol, uri: opts.metadataUri },
      mint: opts.mint,
      denominatedInSol: "true",
      amount: opts.devBuySol,
      slippage: serverConfig.slippagePct,
      priorityFee: serverConfig.priorityFeeSol,
      pool: "pump",
    }),
  });
  if (!res.ok) throw new Error(`PumpPortal ${res.status}: ${await res.text()}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  VersionedTransaction.deserialize(bytes); // throws if PumpPortal returned something that is not a transaction
  return Buffer.from(bytes).toString("base64");
}
