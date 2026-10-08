/**
 * Optional libsql data layer: hosted Turso anywhere, a local file outside
 * Vercel, nothing on Vercel without Turso. Launches never depend on it; it
 * only remembers launched coins and gate decisions for display.
 */
import type { Client, InArgs } from "@libsql/client";
import { serverConfig } from "./config";

export interface TokenRow {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string | null;
  metadata_uri: string | null;
  launcher_wallet: string;
  dev_buy_lamports: number;
  create_sig: string;
  verdict_json: string | null;
  created_at: number;
}
export interface GateRow {
  id: number;
  hash: string;
  allowed: number;
  ai_probability: number;
  summary: string;
  ts: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tokens (
  mint TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  metadata_uri TEXT,
  launcher_wallet TEXT NOT NULL,
  dev_buy_lamports INTEGER NOT NULL DEFAULT 0,
  create_sig TEXT NOT NULL,
  verdict_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS gate_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,
  allowed INTEGER NOT NULL,
  ai_probability REAL NOT NULL,
  summary TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS metadata (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;

declare global {
  var __aalDb: Promise<Client> | undefined;
}

export function dbUrl(): string | null {
  if (serverConfig.tursoUrl) return serverConfig.tursoUrl;
  if (process.env.VERCEL) return null;
  return `file:${serverConfig.dbPath}`;
}
export const dbAvailable = () => dbUrl() !== null;

export function db(): Promise<Client> {
  if (globalThis.__aalDb) return globalThis.__aalDb;
  globalThis.__aalDb = (async () => {
    const u = dbUrl();
    if (!u) throw new Error("No database configured (set TURSO_DATABASE_URL).");
    let c: Client;
    if (u.startsWith("file:")) {
      const { mkdirSync } = await import("node:fs");
      const { dirname } = await import("node:path");
      mkdirSync(dirname(u.slice(5)), { recursive: true });
      const { createClient } = await import("@libsql/client");
      c = createClient({ url: u });
    } else {
      const { createClient } = await import("@libsql/client/web");
      c = createClient({ url: u, authToken: serverConfig.tursoAuthToken || undefined });
    }
    await c.executeMultiple(SCHEMA);
    return c;
  })();
  return globalThis.__aalDb;
}

async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  if (!dbAvailable()) return [];
  return (await (await db()).execute({ sql, args })).rows as unknown as T[];
}
async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}
async function run(sql: string, args: InArgs = []): Promise<number> {
  if (!dbAvailable()) return 0;
  return (await (await db()).execute({ sql, args })).rowsAffected;
}

/* tokens */
export const insertToken = (t: Omit<TokenRow, "created_at">) =>
  run(
    "INSERT OR IGNORE INTO tokens(mint,name,symbol,description,image_url,metadata_uri,launcher_wallet,dev_buy_lamports,create_sig,verdict_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
    [t.mint, t.name, t.symbol, t.description, t.image_url, t.metadata_uri, t.launcher_wallet, t.dev_buy_lamports, t.create_sig, t.verdict_json, Date.now()],
  );
export const listTokens = (limit = 100) => all<TokenRow>("SELECT * FROM tokens ORDER BY created_at DESC LIMIT ?", [limit]);
export const getToken = (mint: string) => one<TokenRow>("SELECT * FROM tokens WHERE mint=?", [mint]);

/* gate decisions */
export const insertGateCheck = (hash: string, allowed: boolean, aiProbability: number, summary: string) =>
  run("INSERT INTO gate_checks(hash,allowed,ai_probability,summary,ts) VALUES(?,?,?,?,?)", [hash, allowed ? 1 : 0, aiProbability, summary, Date.now()]);
export const gateTotals = async () =>
  (await one<{ checked: number; blocked: number }>("SELECT COUNT(*) AS checked, COALESCE(SUM(CASE WHEN allowed=0 THEN 1 ELSE 0 END),0) AS blocked FROM gate_checks")) ?? {
    checked: 0,
    blocked: 0,
  };
export const recentBlocked = (limit = 20) => all<GateRow>("SELECT * FROM gate_checks WHERE allowed=0 ORDER BY ts DESC LIMIT ?", [limit]);

/* self-hosted token metadata (fallback when pump.fun's uploader is down and no Pinata key is set) */
export const insertAsset = (id: string, contentType: string, bytes: Uint8Array) =>
  run("INSERT OR IGNORE INTO assets(id,content_type,bytes,created_at) VALUES(?,?,?,?)", [id, contentType, bytes, Date.now()]);
export const getAsset = (id: string) => one<{ content_type: string; bytes: ArrayBuffer | Uint8Array }>("SELECT content_type, bytes FROM assets WHERE id=?", [id]);
export const insertMetadata = (id: string, json: string) => run("INSERT OR IGNORE INTO metadata(id,json,created_at) VALUES(?,?,?)", [id, json, Date.now()]);
export const getMetadata = async (id: string) => (await one<{ json: string }>("SELECT json FROM metadata WHERE id=?", [id]))?.json;
