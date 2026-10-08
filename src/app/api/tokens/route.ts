import { NextResponse } from "next/server";
import { gateTotals, listTokens } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Coins launched through Anti AI Launchpad and the gate's running totals. */
export async function GET() {
  try {
    const [tokens, gate] = await Promise.all([listTokens(100), gateTotals()]);
    return NextResponse.json({ tokens, gate });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
