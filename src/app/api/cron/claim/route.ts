/**
 * Claims creator rewards for the treasury. Vercel Cron hits this on the
 * schedule in vercel.json; any external pinger (cron-job.org etc.) can hit it
 * every 2 minutes too. `npm run claimer` does the same from any always-on box.
 */
import { NextResponse } from "next/server";
import { runClaim } from "@/lib/server/claim";
import { isLaunchConfigured, serverConfig } from "@/lib/server/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  // If CRON_SECRET is set, require it. Otherwise the route is open: the only thing it can do is send creator rewards to the treasury.
  if (serverConfig.cronSecret && req.headers.get("authorization") !== `Bearer ${serverConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLaunchConfigured()) return NextResponse.json({ error: "Treasury not configured." }, { status: 503 });
  const log: string[] = [];
  try {
    const r = await runClaim((s) => log.push(s));
    return NextResponse.json({ ok: true, ...r, log });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e), log }, { status: 500 });
  }
}
