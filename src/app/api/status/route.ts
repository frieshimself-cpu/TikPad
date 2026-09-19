import { NextResponse } from "next/server";
import { isLaunchConfigured, serverConfig } from "@/lib/server/config";
import { isEphemeralDb } from "@/lib/server/db";
import { TREASURY_ADDRESS } from "@/lib/economics";

export const dynamic = "force-dynamic";

/** Tells the launch form whether real launches are enabled and what they cost. */
export async function GET() {
  return NextResponse.json({
    launchEnabled: isLaunchConfigured(),
    treasury: TREASURY_ADDRESS,
    networkLamports: serverConfig.launchNetworkLamports,
    feeLamports: serverConfig.launchFeeLamports,
    maxDevBuySol: serverConfig.maxDevBuySol,
    persistentDb: !isEphemeralDb(),
  });
}
