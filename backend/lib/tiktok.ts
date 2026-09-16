/**
 * TikTok handle helpers + Login Kit (OAuth 2.0) client.
 * Docs: https://developers.tiktok.com/doc/login-kit-web/
 */
import { config } from "./config";

const HANDLE_RE = /^[a-z0-9._]{2,24}$/;

/** Accepts "@handle", "handle", or a full tiktok.com/@handle URL. Returns the bare lowercase handle or null. */
export function normalizeHandle(input: string): string | null {
  let s = input.trim();
  const m = s.match(/tiktok\.com\/@([^/?#\s]+)/i);
  if (m) s = m[1];
  s = s.replace(/^@+/, "").toLowerCase();
  if (!HANDLE_RE.test(s)) return null;
  if (s.endsWith(".")) return null;
  return s;
}

export const profileUrl = (handle: string) => `https://www.tiktok.com/@${handle}`;

export const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const TIKTOK_USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

export const tiktokRedirectUri = () => `${config.appUrl}/api/auth/tiktok/callback`;

export function buildAuthorizeUrl(state: string) {
  const p = new URLSearchParams({
    client_key: config.tiktokClientKey,
    scope: "user.info.basic,user.info.profile",
    response_type: "code",
    redirect_uri: tiktokRedirectUri(),
    state,
  });
  return `${TIKTOK_AUTHORIZE_URL}?${p.toString()}`;
}

export interface TikTokProfile {
  openId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; openId: string }> {
  const body = new URLSearchParams({
    client_key: config.tiktokClientKey,
    client_secret: config.tiktokClientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: tiktokRedirectUri(),
  });
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    open_id?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token || !json.open_id) {
    throw new Error(json.error_description ?? json.error ?? `TikTok token exchange failed (${res.status})`);
  }
  return { accessToken: json.access_token, openId: json.open_id };
}

export async function fetchProfile(accessToken: string): Promise<TikTokProfile> {
  const url = `${TIKTOK_USERINFO_URL}?fields=open_id,union_id,avatar_url,display_name,username`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = (await res.json()) as {
    data?: { user?: { open_id: string; username?: string; display_name?: string; avatar_url?: string } };
    error?: { code?: string; message?: string };
  };
  const u = json.data?.user;
  if (!res.ok || !u) throw new Error(json.error?.message ?? `TikTok user info failed (${res.status})`);
  const username = normalizeHandle(u.username ?? "");
  if (!username) throw new Error("TikTok did not return a username. Make sure the user.info.profile scope is approved.");
  return {
    openId: u.open_id,
    username,
    displayName: u.display_name ?? username,
    avatarUrl: u.avatar_url ?? null,
  };
}
