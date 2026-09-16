import { NextResponse } from "next/server";
import { ready } from "@/lib/bootstrap";
import { balanceForHandle, getCreatorById, listCreditsForHandle, listPayoutsForHandle, listTokensForHandle } from "@/lib/db";
import { nextMilestoneCents } from "@/lib/router";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  ready();
  const s = await getSession();
  if (!s) return NextResponse.json({ me: null, demo: isDemoMode() });
  const creator = getCreatorById(s.creatorId);
  if (!creator) return NextResponse.json({ me: null, demo: isDemoMode() });
  const balance = balanceForHandle(creator.handle);
  return NextResponse.json({
    demo: isDemoMode(),
    me: {
      handle: creator.handle,
      display_name: creator.display_name,
      avatar_url: creator.avatar_url,
      payout_wallet: creator.payout_wallet,
      balance,
      next_milestone_cents: nextMilestoneCents(balance.paid_cents),
      tokens: listTokensForHandle(creator.handle),
      credits: listCreditsForHandle(creator.handle, 30),
      payouts: listPayoutsForHandle(creator.handle, 30),
    },
  });
}
