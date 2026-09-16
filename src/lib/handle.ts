const HANDLE_RE = /^[a-z0-9._]{2,24}$/;

/** Accepts "@handle", "handle", or a full tiktok.com/@handle URL. Returns the bare lowercase handle or null. */
export function normalizeHandle(input: string): string | null {
  let s = input.trim();
  const m = s.match(/tiktok\.com\/@([^/?#\s]+)/i);
  if (m) s = m[1];
  s = s.replace(/^@+/, "").toLowerCase();
  if (!HANDLE_RE.test(s) || s.endsWith(".")) return null;
  return s;
}

export const profileUrl = (handle: string) => `https://www.tiktok.com/@${handle}`;

/** The text a launch puts in the token description so the routing is visible on pump.fun. */
export const feeTag = (handle: string) => `Fees to @${handle} via TikPad`;
