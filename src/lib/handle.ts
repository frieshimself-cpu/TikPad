const HANDLE_RE = /^[a-z0-9_]{1,15}$/;

/** Accepts "@handle", "handle", or a full x.com/handle or twitter.com/handle URL. Returns the bare lowercase handle or null. */
export function normalizeHandle(input: string): string | null {
  let s = input.trim();
  const m = s.match(/(?:x|twitter)\.com\/@?([^/?#\s]+)/i);
  if (m) s = m[1];
  s = s.replace(/^@+/, "").toLowerCase();
  if (!HANDLE_RE.test(s)) return null;
  return s;
}

export const profileUrl = (handle: string) => `https://x.com/${handle}`;

/** The text a launch puts in the token description so the routing is visible on pump.fun. */
export const feeTag = (handle: string) => `Fees to @${handle} via RePaid`;
