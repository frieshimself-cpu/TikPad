import { NextResponse } from "next/server";
import { ready } from "@/lib/bootstrap";
import { activityFeed, globalStats, leaderboard } from "@/lib/db";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  ready();
  return NextResponse.json({ demo: isDemoMode(), feed: activityFeed(40), stats: globalStats(), leaderboard: leaderboard(8) });
}
