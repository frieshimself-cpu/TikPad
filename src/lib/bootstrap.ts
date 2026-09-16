import { isDemoMode } from "./config";
import { db, getMeta, setMeta } from "./db";
import { seedDemoData } from "./demo";
import { simulateDemoClaim, runPayouts } from "./router";

/** Open the DB and, in demo mode, make sure sample data exists. Safe to call on every request. */
export async function ready() {
  await db();
  if (isDemoMode()) await seedDemoData();
}

/**
 * Demo mode has no worker on serverless hosts, so the feed simulates a fee claim
 * opportunistically on reads, at most once a minute. No-op outside demo mode.
 */
export async function demoTick() {
  if (!isDemoMode() || process.env.DEMO_SIMULATE === "0") return;
  const last = Number((await getMeta("demo_last_tick")) ?? 0);
  if (Date.now() - last < 60_000) return;
  await setMeta("demo_last_tick", String(Date.now()));
  try {
    await simulateDemoClaim();
    await runPayouts();
  } catch (e) {
    console.error("demo tick failed", e);
  }
}
