import { NextResponse } from "next/server";
import { z } from "zod";
import { isLaunchConfigured, serverConfig } from "@/lib/server/config";
import { quoteLaunch } from "@/lib/server/launch";
import { isValidPubkey } from "@/lib/server/solana";

const Body = z.object({ wallet: z.string().min(32).max(64), devBuySol: z.number().min(0).max(serverConfig.maxDevBuySol) });

export async function POST(req: Request) {
  if (!isLaunchConfigured()) return NextResponse.json({ error: "Launching is not configured on this server yet." }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!isValidPubkey(parsed.data.wallet)) return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  try {
    return NextResponse.json(await quoteLaunch(parsed.data.wallet, parsed.data.devBuySol));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Quote failed." }, { status: 500 });
  }
}
