import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ready } from "@/lib/bootstrap";
import { config } from "@/lib/config";
import { upsertCreator } from "@/lib/db";
import { setSession } from "@/lib/session";
import { exchangeCode, fetchProfile } from "@/lib/tiktok";

export async function GET(req: Request) {
  await ready();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const store = await cookies();
  const expected = store.get("tikpad_oauth_state")?.value;
  store.delete("tikpad_oauth_state");

  const fail = (msg: string) => NextResponse.redirect(`${config.appUrl}/claim?error=${encodeURIComponent(msg)}`);
  if (err) return fail(err);
  if (!code || !state || state !== expected) return fail("Sign-in state mismatch. Please try again.");

  try {
    const { accessToken, openId } = await exchangeCode(code);
    const profile = await fetchProfile(accessToken);
    const creator = await upsertCreator({ handle: profile.username, display_name: profile.displayName, avatar_url: profile.avatarUrl, tiktok_open_id: openId });
    await setSession({ creatorId: creator.id, handle: creator.handle });
    return NextResponse.redirect(`${config.appUrl}/claim`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "TikTok sign-in failed.");
  }
}
