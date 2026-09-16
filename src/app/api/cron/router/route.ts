/**
 * Serverless entry point for the fee router. Vercel Cron calls this on the
 * schedule in vercel.json with `Authorization: Bearer $CRON_SECRET`.
 * It runs one cycle: claim creator fees → attribute → pay milestones.
 *
 * Note: without the streaming worker (scripts/worker.ts) no trade volume is
 * recorded, so a real claim with no tracked trades is parked under the
 * protocol account rather than mis-attributed. Run the worker somewhere
 * (Railway, Fly, a VPS) for volume tracking; the cron handles claims/payouts.
 */
import { NextResponse } from "next/server";
import { ready } from "@/lib/bootstrap";
import { config, isDemoMode } from "@/lib/config";
import { runCycle } from "@/lib/router";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (config.cronSecret) {
    if (req.headers.get("authorization") !== `Bearer ${config.cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else if (!isDemoMode()) {
    return NextResponse.json({ error: "Set CRON_SECRET to enable the cron route outside demo mode." }, { status: 403 });
  }
  await ready();
  const log: string[] = [];
  try {
    const paid = await runCycle((s) => log.push(s));
    return NextResponse.json({ ok: true, demo: isDemoMode(), paid: paid.length, log });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e), log }, { status: 500 });
  }
}
