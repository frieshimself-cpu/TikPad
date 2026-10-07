import { NextResponse } from "next/server";
import { detectorNames, gateReady } from "@/lib/server/aiDetect";
import { serverConfig } from "@/lib/server/config";
import { dbAvailable } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Tells the launch form whether launches are open, which detectors guard them, and the limits. */
export async function GET() {
  return NextResponse.json({
    launchEnabled: gateReady(),
    detectors: detectorNames(),
    threshold: serverConfig.aiBlockThreshold,
    maxDevBuySol: serverConfig.maxDevBuySol,
    priorityFeeSol: serverConfig.priorityFeeSol,
    slippagePct: serverConfig.slippagePct,
    persistentDb: dbAvailable(),
  });
}
