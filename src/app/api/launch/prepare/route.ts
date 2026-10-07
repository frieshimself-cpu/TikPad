import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { checkImage, gateReady, reuseVerdict, type ImageVerdict } from "@/lib/server/aiDetect";
import { serverConfig } from "@/lib/server/config";
import { dbAvailable, insertAsset, insertGateCheck, insertMetadata } from "@/lib/server/db";
import { readImage, type UploadedImage } from "@/lib/server/image";
import { buildCreateTx, buildMetadataJson, pumpIpfsUpload, uploadMetadata } from "@/lib/server/pumpportal";
import { isValidPubkey } from "@/lib/server/solana";
import { signToken } from "@/lib/server/tokens";

export const maxDuration = 120;

const Fields = z.object({
  name: z.string().trim().min(1).max(32),
  symbol: z.string().trim().min(1).max(10).regex(/^[A-Za-z0-9]+$/, "Ticker must be letters and numbers only"),
  description: z.string().trim().max(500).default(""),
  wallet: z.string().min(32).max(64),
  mint: z.string().min(32).max(64),
  devBuySol: z.coerce.number().min(0),
  twitter: z.string().trim().max(200).optional(),
  telegram: z.string().trim().max(200).optional(),
  website: z.string().trim().max(200).optional(),
  verdictToken: z.string().max(4000).optional(),
});

async function hostMetadata(input: z.infer<typeof Fields>, image: UploadedImage, origin: string) {
  const meta = {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: new Blob([Buffer.from(image.bytes)], { type: image.type }),
    imageName: image.name,
    twitter: input.twitter,
    telegram: input.telegram,
    website: input.website,
  };
  if (serverConfig.pinataJwt) return uploadMetadata(meta);
  try {
    return await pumpIpfsUpload(meta);
  } catch (e) {
    if (!dbAvailable()) throw e;
    const id = createHash("sha256").update(image.bytes).digest("hex").slice(0, 24);
    await insertAsset(id, image.type, image.bytes);
    const imageUrl = `${origin}/api/img/${id}`;
    await insertMetadata(id, JSON.stringify(buildMetadataJson(meta, imageUrl)));
    return { imageUrl, metadataUri: `${origin}/api/meta/${id}` };
  }
}

/**
 * Step 1 of a launch. Runs the AI-image gate, hosts the metadata, and returns
 * an unsigned pump.fun create transaction for the launcher's wallet. The
 * launcher signs and sends it themselves; nothing is created unless the
 * image passed.
 */
export async function POST(req: Request) {
  if (!gateReady()) return NextResponse.json({ error: "Launching is paused: image verification is not configured on this server." }, { status: 503 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const raw: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = Fields.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `${issue.path.join(".")}: ${issue.message}` }, { status: 400 });
  }
  const input = { ...parsed.data, symbol: parsed.data.symbol.toUpperCase() };
  if (!isValidPubkey(input.wallet) || !isValidPubkey(input.mint)) return NextResponse.json({ error: "Invalid wallet or mint address." }, { status: 400 });
  if (input.devBuySol > serverConfig.maxDevBuySol) return NextResponse.json({ error: `Dev buy is capped at ${serverConfig.maxDevBuySol} SOL.` }, { status: 400 });
  const image = await readImage(form);
  if (typeof image === "string") return NextResponse.json({ error: image }, { status: 400 });

  // The gate. A verdict token from /api/image-check for these exact bytes is reused; anything else is re-checked.
  let verdict: ImageVerdict | null = reuseVerdict(input.verdictToken, image.bytes);
  if (!verdict) {
    try {
      verdict = await checkImage(image.bytes, image.type);
      insertGateCheck(verdict.hash, verdict.allowed, verdict.aiProbability, verdict.summary).catch(() => {});
    } catch (e) {
      console.error("image check failed:", e);
      return NextResponse.json({ error: e instanceof Error ? e.message : "Could not verify the image. Try again." }, { status: 502 });
    }
  }
  if (!verdict.allowed) return NextResponse.json({ error: verdict.summary, verdict }, { status: 422 });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${proto}://${host}`;

  try {
    const { imageUrl, metadataUri } = await hostMetadata(input, image, origin);
    const tx = await buildCreateTx({ wallet: input.wallet, mint: input.mint, name: input.name, symbol: input.symbol, metadataUri, devBuySol: input.devBuySol });
    // Signed record of what was prepared, so /confirm can store it without trusting the client's copy.
    const launchToken = signToken({
      mint: input.mint,
      wallet: input.wallet,
      name: input.name,
      symbol: input.symbol,
      description: input.description,
      imageUrl,
      metadataUri,
      devBuySol: input.devBuySol,
      verdict: { verdict: verdict.verdict, aiProbability: verdict.aiProbability, detectors: verdict.detectors, summary: verdict.summary },
    });
    return NextResponse.json({ tx, mint: input.mint, imageUrl, metadataUri, verdict, launchToken });
  } catch (e) {
    console.error("launch prepare failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not prepare the launch." }, { status: 502 });
  }
}
