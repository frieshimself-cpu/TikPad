import { NextResponse } from "next/server";
import { claimTotals, listClaims, listTokens } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Coins launched through FansPad and the treasury's claim history. */
export async function GET() {
  try {
    const [tokens, claims, totals] = await Promise.all([listTokens(100), listClaims(50), claimTotals()]);
    return NextResponse.json({ tokens, claims, totals });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
