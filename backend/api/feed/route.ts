import { NextResponse } from "next/server";
import { demoTick, ready } from "@/lib/bootstrap";
import { activityFeed, globalStats, leaderboard } from "@/lib/db";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  await ready();
  await demoTick();
  const [feed, stats, top] = await Promise.all([activityFeed(40), globalStats(), leaderboard(8)]);
  return NextResponse.json({ demo: isDemoMode(), feed, stats, leaderboard: top });
}
