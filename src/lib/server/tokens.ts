/**
 * Short-lived HMAC tokens. Used to hand an image verdict back to the client so
 * the launch step can reuse it instead of paying for a second detection run.
 * Verification failures return null: the caller simply re-runs the check.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { serverConfig } from "./config";

declare global {
  var __realpadSecret: Buffer | undefined;
}

function secret(): Buffer {
  if (serverConfig.appSecret) return Buffer.from("realpad:" + serverConfig.appSecret);
  // No APP_SECRET: a per-process secret. Tokens then only survive on the same warm instance,
  // which is fine because a failed verification just means running the detectors again.
  if (!globalThis.__realpadSecret) globalThis.__realpadSecret = randomBytes(32);
  return globalThis.__realpadSecret;
}

export function signToken<T extends object>(payload: T): string {
  const body = Buffer.from(JSON.stringify({ ...payload, ts: Date.now() })).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyToken<T extends object>(token: string, maxAgeMs: number): (T & { ts: number }) | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { ts: number };
    if (typeof p.ts !== "number" || Date.now() - p.ts > maxAgeMs) return null;
    return p;
  } catch {
    return null;
  }
}
