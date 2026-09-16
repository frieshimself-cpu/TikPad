import { NextResponse } from "next/server";
import { z } from "zod";
import { ready } from "@/lib/bootstrap";
import { config } from "@/lib/config";
import { quoteLaunch } from "@/lib/launch";
import { isValidPubkey } from "@/lib/solana";
import { normalizeHandle } from "@/lib/tiktok";

const Body = z.object({
  wallet: z.string().min(32).max(64),
  handle: z.string().min(1).max(64),
  devBuySol: z.number().min(0).max(config.maxDevBuySol),
});

export async function POST(req: Request) {
  await ready();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { wallet, devBuySol } = parsed.data;
  const handle = normalizeHandle(parsed.data.handle);
  if (!handle) return NextResponse.json({ error: "That does not look like a TikTok handle." }, { status: 400 });
  if (!isValidPubkey(wallet)) return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  return NextResponse.json(await quoteLaunch(wallet, handle, devBuySol));
}
