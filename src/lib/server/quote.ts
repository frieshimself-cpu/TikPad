/**
 * Stateless launch quotes. The quote is an HMAC-signed token, so no database is
 * needed between "quote" and "launch". The signing secret is derived from the
 * treasury key, so there is nothing extra to configure.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { serverConfig } from "./config";

export interface QuotePayload {
  n: string; // nonce, also used as the payment memo
  w: string; // launcher wallet
  d: number; // dev buy lamports
  t: number; // total lamports the launcher must pay
  ts: number; // issued at (ms)
}

function secret() {
  return createHash("sha256").update("fanspad-quote:" + serverConfig.treasurySecretKey).digest();
}

export function signQuote(p: QuotePayload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyQuote(token: string): QuotePayload {
  const [body, mac] = token.split(".");
  if (!body || !mac) throw new Error("Malformed launch quote.");
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid launch quote.");
  const p = JSON.parse(Buffer.from(body, "base64url").toString()) as QuotePayload;
  if (Date.now() - p.ts > 30 * 60 * 1000) throw new Error("Launch quote expired. Start again.");
  return p;
}

export const newNonce = () => `fp_${randomBytes(8).toString("hex")}`;
