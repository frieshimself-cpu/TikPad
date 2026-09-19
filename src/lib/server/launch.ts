/**
 * Launch orchestration: signed quote → verify payment → metadata → pump.fun
 * create (treasury as creator) → sweep dev buy to launcher.
 *
 * Stateless by design: the quote is an HMAC token and the mint keypair is
 * derived from the payment signature, so replaying a payment would try to
 * create a mint that already exists and fail on chain. The database is only
 * used, best effort, to remember launched coins for display.
 */
import { createHash } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, isLaunchConfigured, serverConfig } from "./config";
import { insertAsset, insertMetadata, insertToken, isEphemeralDb, setSweepSig } from "./db";
import { buildMetadataJson, createToken, pumpIpfsUpload, uploadMetadata } from "./pumpportal";
import { newNonce, signQuote, verifyQuote } from "./quote";
import { sweepTokensTo, verifyPayment } from "./solana";
import { TREASURY_ADDRESS } from "../economics";

export interface LaunchInput {
  name: string;
  symbol: string;
  description: string;
  wallet: string;
  image: { bytes: Uint8Array; type: string; name: string };
  twitter?: string;
  telegram?: string;
  website?: string;
  /** Public origin of this deployment, used only for the self-hosted metadata fallback. */
  origin: string;
}

export async function quoteLaunch(wallet: string, devBuySol: number) {
  const dev_buy_lamports = Math.round(devBuySol * LAMPORTS_PER_SOL);
  const total_lamports = dev_buy_lamports + serverConfig.launchNetworkLamports + serverConfig.launchFeeLamports;
  const n = newNonce();
  const id = signQuote({ n, w: wallet, d: dev_buy_lamports, t: total_lamports, ts: Date.now() });
  return {
    id,
    memo: n,
    treasury: TREASURY_ADDRESS,
    dev_buy_lamports,
    network_lamports: serverConfig.launchNetworkLamports,
    fee_lamports: serverConfig.launchFeeLamports,
    total_lamports,
  };
}

/** Mint keypair derived from the payment signature: one payment can only ever create one coin. */
const mintFor = (paymentSig: string) => Keypair.fromSeed(createHash("sha256").update("fanspad:mint:" + paymentSig).digest());

async function hostMetadata(input: LaunchInput, description: string) {
  const meta = {
    name: input.name,
    symbol: input.symbol,
    description,
    image: new Blob([Buffer.from(input.image.bytes)], { type: input.image.type }),
    imageName: input.image.name,
    twitter: input.twitter,
    telegram: input.telegram,
    website: input.website,
  };
  if (serverConfig.pinataJwt) return uploadMetadata(meta);
  try {
    return await pumpIpfsUpload(meta);
  } catch (e) {
    if (isEphemeralDb()) throw e;
    // Fallback: serve it ourselves (needs a persistent database).
    const id = createHash("sha256").update(input.image.bytes).digest("hex").slice(0, 24);
    await insertAsset(id, input.image.type, input.image.bytes);
    const imageUrl = `${input.origin}/api/img/${id}`;
    await insertMetadata(id, JSON.stringify(buildMetadataJson({ name: input.name, symbol: input.symbol, description, twitter: input.twitter, telegram: input.telegram, website: input.website }, imageUrl)));
    return { imageUrl, metadataUri: `${input.origin}/api/meta/${id}` };
  }
}

export async function executeLaunch(quoteId: string, paymentSig: string, input: LaunchInput) {
  if (!isLaunchConfigured()) throw new Error("Launching is not configured on this server (TREASURY_SECRET_KEY).");
  const q = verifyQuote(quoteId);
  if (q.w !== input.wallet) throw new Error("Quote does not match this wallet.");

  await verifyPayment(paymentSig, input.wallet, q.t, q.n);

  const description = input.description.trim();
  const { imageUrl, metadataUri } = await hostMetadata(input, description);
  const { mint, signature } = await createToken({
    name: input.name,
    symbol: input.symbol,
    metadataUri,
    devBuySol: q.d / LAMPORTS_PER_SOL,
    mintKeypair: mintFor(paymentSig),
  });

  try {
    await insertToken({
      mint,
      name: input.name,
      symbol: input.symbol,
      description,
      image_url: imageUrl,
      metadata_uri: metadataUri,
      launcher_wallet: input.wallet,
      dev_buy_lamports: q.d,
      create_sig: signature,
      sweep_sig: null,
    });
  } catch (e) {
    console.error("token record not saved (database unavailable):", e);
  }

  let sweepSig: string | null = null;
  if (q.d > 0) {
    try {
      sweepSig = await sweepTokensTo(mint, input.wallet);
      if (sweepSig) await setSweepSig(mint, sweepSig).catch(() => {});
    } catch (e) {
      // The coin exists; the sweep can be retried from the treasury by hand.
      console.error("dev-buy sweep failed for", mint, e);
    }
  }
  return { mint, signature, sweepSig, imageUrl };
}
