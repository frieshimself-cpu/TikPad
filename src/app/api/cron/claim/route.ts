/**
 * Claims creator rewards for the treasury. Vercel Cron hits this on the
 * schedule in vercel.json with `Authorization: Bearer $CRON_SECRET`.
 * For a 2-minute cadence without Vercel Pro, run `npm run claimer` instead.
 */
import { NextResponse } from "next/server";
import { runClaim } from "@/lib/server/claim";
import { isLaunchConfigured, serverConfig } from "@/lib/server/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!serverConfig.cronSecret) return NextResponse.json({ error: "Set CRON_SECRET to enable the claim route." }, { status: 403 });
  if (req.headers.get("authorization") !== `Bearer ${serverConfig.cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isLaunchConfigured()) return NextResponse.json({ error: "Treasury not configured." }, { status: 503 });
  const log: string[] = [];
  try {
    const r = await runClaim((s) => log.push(s));
    return NextResponse.json({ ok: true, ...r, log });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e), log }, { status: 500 });
  }
}
