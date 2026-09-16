/**
 * Minimal signed-cookie sessions (HMAC-SHA256). No external auth library needed.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { config } from "./config";

const COOKIE = "tikpad_session";
let warned = false;

function secret() {
  if (config.sessionSecret) return config.sessionSecret;
  // A fixed fallback keeps sessions valid across serverless instances. Set SESSION_SECRET in production.
  if (!warned) {
    warned = true;
    console.warn("SESSION_SECRET is not set; using an insecure default. Set it before going live.");
  }
  return "tikpad-insecure-default-session-secret";
}

export interface Session {
  creatorId: number;
  handle: string;
  iat: number;
}

export function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify<T = unknown>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const s = verify<Session>(store.get(COOKIE)?.value);
  if (!s || typeof s.creatorId !== "number") return null;
  // 30-day sessions
  if (Date.now() - s.iat > 30 * 24 * 3600 * 1000) return null;
  return s;
}

export async function setSession(s: Omit<Session, "iat">) {
  const store = await cookies();
  store.set(COOKIE, sign({ ...s, iat: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: config.appUrl.startsWith("https"),
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export const randomState = () => randomBytes(16).toString("hex");
