import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { config, isTikTokConfigured } from "@/lib/config";
import { randomState } from "@/lib/session";
import { buildAuthorizeUrl } from "@/lib/tiktok";

/** Starts the TikTok Login Kit flow. Without TikTok credentials, sends the user to the demo sign-in. */
export async function GET() {
  if (!isTikTokConfigured()) return NextResponse.redirect(`${config.appUrl}/claim?demo=1`);
  const state = randomState();
  const store = await cookies();
  store.set("tikpad_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: config.appUrl.startsWith("https") });
  return NextResponse.redirect(buildAuthorizeUrl(state));
}
