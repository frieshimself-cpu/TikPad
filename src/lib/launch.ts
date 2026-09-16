/**
 * Launch orchestration shared by the API route and demo mode.
 */
import { randomBytes } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { config, feeTag, isDemoMode, LAMPORTS_PER_SOL } from "./config";
import { getQuote, insertQuote, insertToken, markQuoteUsed, updateTokenStatus } from "./db";
import { createToken, uploadMetadata } from "./pumpportal";
import { sweepTokensTo, treasuryAddress, verifyPayment } from "./solana";

export interface LaunchInput {
  name: string;
  symbol: string;
  description: string;
  handle: string;
  devBuySol: number;
  wallet: string;
  image: { bytes: Uint8Array; type: string; name: string } | null;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export function quoteLaunch(wallet: string, handle: string, devBuySol: number) {
  const dev_buy_lamports = Math.round(devBuySol * LAMPORTS_PER_SOL);
  const total_lamports = dev_buy_lamports + config.launchNetworkLamports + config.launchFeeLamports;
  const id = `tp_${randomBytes(8).toString("hex")}`;
  insertQuote({ id, wallet, handle, dev_buy_lamports, total_lamports });
  return {
    id,
    treasury: treasuryAddress(),
    dev_buy_lamports,
    network_lamports: config.launchNetworkLamports,
    fee_lamports: config.launchFeeLamports,
    total_lamports,
    demo: isDemoMode(),
  };
}

export async function executeLaunch(quoteId: string, paymentSig: string | null, input: LaunchInput) {
  const q = getQuote(quoteId);
  if (!q) throw new Error("Unknown launch quote.");
  if (q.used) throw new Error("This launch quote was already used.");
  if (q.wallet !== input.wallet || q.handle !== input.handle) throw new Error("Quote does not match this launch.");
  if (Date.now() - q.created_at > 30 * 60 * 1000) throw new Error("Launch quote expired. Start again.");

  const description = `${input.description.trim()}\n\n${feeTag(input.handle)}`.trim();

  if (isDemoMode()) {
    // Simulated launch: no chain interaction, clearly flagged as demo.
    const mint = Keypair.generate().publicKey.toBase58();
    markQuoteUsed(quoteId);
    insertToken({
      mint,
      name: input.name,
      symbol: input.symbol,
      description,
      image_url: input.image ? `data:${input.image.type};base64,${Buffer.from(input.image.bytes).toString("base64")}` : null,
      metadata_uri: null,
      recipient_handle: input.handle,
      launcher_wallet: input.wallet,
      dev_buy_lamports: q.dev_buy_lamports,
      create_sig: `demo-${randomBytes(6).toString("hex")}`,
      status: "live",
      demo: 1,
    });
    return { mint, signature: null as string | null, demo: true, imageUrl: null as string | null };
  }

  if (!paymentSig) throw new Error("Missing payment signature.");
  if (!input.image) throw new Error("A token image is required.");
  await verifyPayment(paymentSig, input.wallet, q.total_lamports, quoteId);
  markQuoteUsed(quoteId);

  const { imageUrl, metadataUri } = await uploadMetadata({
    name: input.name,
    symbol: input.symbol,
    description,
    image: new Blob([Buffer.from(input.image.bytes)], { type: input.image.type }),
    imageName: input.image.name,
    twitter: input.twitter,
    telegram: input.telegram,
    website: input.website,
  });

  const { mint, signature } = await createToken({
    name: input.name,
    symbol: input.symbol,
    metadataUri,
    devBuySol: q.dev_buy_lamports / LAMPORTS_PER_SOL,
  });

  insertToken({
    mint,
    name: input.name,
    symbol: input.symbol,
    description,
    image_url: imageUrl,
    metadata_uri: metadataUri,
    recipient_handle: input.handle,
    launcher_wallet: input.wallet,
    dev_buy_lamports: q.dev_buy_lamports,
    create_sig: signature,
    status: "live",
    demo: 0,
  });

  // Hand the dev-buy tokens to the launcher. Failure here must not lose the launch record.
  if (q.dev_buy_lamports > 0) {
    try {
      await sweepTokensTo(mint, input.wallet);
    } catch (e) {
      console.error("dev-buy sweep failed for", mint, e);
      updateTokenStatus(mint, "live", signature);
    }
  }
  return { mint, signature, demo: false, imageUrl };
}
