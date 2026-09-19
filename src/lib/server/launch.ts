/** Launch orchestration: quote → verify payment → IPFS → pump.fun create → sweep dev buy to launcher. */
import { randomBytes } from "node:crypto";
import { LAMPORTS_PER_SOL, isLaunchConfigured, serverConfig } from "./config";
import { claimQuote, getQuote, insertAsset, insertMetadata, insertQuote, insertToken, setSweepSig, spendPayment } from "./db";
import { buildMetadataJson, createToken, uploadMetadata } from "./pumpportal";
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
  /** Public origin of this deployment (for self-hosted metadata URLs), e.g. https://fanspad.vercel.app */
  origin: string;
}

/** Store image + metadata in our own database and return URLs served by /api/img and /api/meta. */
async function selfHostMetadata(input: LaunchInput, description: string) {
  const id = randomBytes(12).toString("hex");
  await insertAsset(id, input.image.type, input.image.bytes);
  const imageUrl = `${input.origin}/api/img/${id}`;
  const json = buildMetadataJson({ name: input.name, symbol: input.symbol, description, twitter: input.twitter, telegram: input.telegram, website: input.website }, imageUrl);
  await insertMetadata(id, JSON.stringify(json));
  return { imageUrl, metadataUri: `${input.origin}/api/meta/${id}` };
}

export async function quoteLaunch(wallet: string, devBuySol: number) {
  const dev_buy_lamports = Math.round(devBuySol * LAMPORTS_PER_SOL);
  const total_lamports = dev_buy_lamports + serverConfig.launchNetworkLamports + serverConfig.launchFeeLamports;
  const id = `fp_${randomBytes(8).toString("hex")}`;
  await insertQuote({ id, wallet, dev_buy_lamports, total_lamports });
  return {
    id,
    treasury: TREASURY_ADDRESS,
    dev_buy_lamports,
    network_lamports: serverConfig.launchNetworkLamports,
    fee_lamports: serverConfig.launchFeeLamports,
    total_lamports,
  };
}

export async function executeLaunch(quoteId: string, paymentSig: string, input: LaunchInput) {
  if (!isLaunchConfigured()) throw new Error("Launching is not configured on this server (TREASURY_SECRET_KEY).");
  const q = await getQuote(quoteId);
  if (!q) throw new Error("Unknown launch quote. Start again.");
  if (q.used) throw new Error("This launch was already used.");
  if (q.wallet !== input.wallet) throw new Error("Quote does not match this wallet.");
  if (Date.now() - q.created_at > 30 * 60 * 1000) throw new Error("Launch quote expired. Start again.");

  await verifyPayment(paymentSig, input.wallet, q.total_lamports, quoteId);
  if (!(await spendPayment(paymentSig))) throw new Error("This payment was already used for a launch.");
  if (!(await claimQuote(quoteId))) throw new Error("This launch was already used.");

  const description = input.description.trim();
  const { imageUrl, metadataUri } = serverConfig.pinataJwt
    ? await uploadMetadata({
        name: input.name,
        symbol: input.symbol,
        description,
        image: new Blob([Buffer.from(input.image.bytes)], { type: input.image.type }),
        imageName: input.image.name,
        twitter: input.twitter,
        telegram: input.telegram,
        website: input.website,
      })
    : await selfHostMetadata(input, description);

  const { mint, signature } = await createToken({ name: input.name, symbol: input.symbol, metadataUri, devBuySol: q.dev_buy_lamports / LAMPORTS_PER_SOL });

  await insertToken({
    mint,
    name: input.name,
    symbol: input.symbol,
    description,
    image_url: imageUrl,
    metadata_uri: metadataUri,
    launcher_wallet: input.wallet,
    dev_buy_lamports: q.dev_buy_lamports,
    create_sig: signature,
    sweep_sig: null,
  });

  let sweepSig: string | null = null;
  if (q.dev_buy_lamports > 0) {
    try {
      sweepSig = await sweepTokensTo(mint, input.wallet);
      if (sweepSig) await setSweepSig(mint, sweepSig);
    } catch (e) {
      // The coin exists and is recorded; the sweep can be retried from the treasury by hand.
      console.error("dev-buy sweep failed for", mint, e);
    }
  }
  return { mint, signature, sweepSig, imageUrl };
}
