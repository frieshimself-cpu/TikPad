import { NextResponse } from "next/server";
import { z } from "zod";
import { insertToken } from "@/lib/server/db";
import { verifyCreateTx } from "@/lib/server/solana";
import { verifyToken } from "@/lib/server/tokens";

export const maxDuration = 60;

interface LaunchClaim {
  mint: string;
  wallet: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string | null;
  metadataUri: string;
  devBuySol: number;
  verdict: unknown;
}

const Body = z.object({ launchToken: z.string().max(8000), signature: z.string().min(32).max(128) });

/** Step 2 of a launch: the signed transaction landed. Verify it on chain and remember the coin. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const claim = verifyToken<LaunchClaim>(parsed.data.launchToken, 30 * 60 * 1000);
  if (!claim) return NextResponse.json({ error: "Launch token expired or invalid." }, { status: 400 });

  const ok = await verifyCreateTx(parsed.data.signature, claim.mint, claim.wallet);
  if (!ok) return NextResponse.json({ error: "Could not find a successful creation transaction for this mint yet." }, { status: 409 });

  try {
    await insertToken({
      mint: claim.mint,
      name: claim.name,
      symbol: claim.symbol,
      description: claim.description,
      image_url: claim.imageUrl,
      metadata_uri: claim.metadataUri,
      launcher_wallet: claim.wallet,
      dev_buy_lamports: Math.round(claim.devBuySol * 1e9),
      create_sig: parsed.data.signature,
      verdict_json: JSON.stringify(claim.verdict),
    });
  } catch (e) {
    console.error("token record not saved (database unavailable):", e);
  }
  return NextResponse.json({ ok: true, mint: claim.mint });
}
