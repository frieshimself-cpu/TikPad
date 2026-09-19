/**
 * Opportunistic claiming: any server-rendered page view triggers a claim if the
 * last attempt on this instance was more than CLAIM_INTERVAL_MS ago. Runs after
 * the response is sent, so it never slows a page. Complements the cron/claimer.
 */
import { after } from "next/server";
import { CLAIM_INTERVAL_MS } from "../economics";
import { runClaim } from "./claim";
import { isLaunchConfigured } from "./config";

declare global {
  var __fanspadLastClaim: number | undefined;
}

export function scheduleOpportunisticClaim() {
  if (!isLaunchConfigured() || process.env.NEXT_PHASE === "phase-production-build") return;
  const last = globalThis.__fanspadLastClaim ?? 0;
  if (Date.now() - last < CLAIM_INTERVAL_MS) return;
  globalThis.__fanspadLastClaim = Date.now();
  after(async () => {
    try {
      await runClaim((s) => console.log("[autoclaim]", s));
    } catch (e) {
      console.error("[autoclaim] failed:", e instanceof Error ? e.message : e);
    }
  });
}
