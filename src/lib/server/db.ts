/**
 * libsql data layer. TURSO_DATABASE_URL for hosted (required on Vercel for
 * launches to be reliable), otherwise a local file. Tables: launched tokens,
 * one-time launch quotes, and fee claims.
 */
import { createClient, type Client, type InArgs } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
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
  sweep_sig: string | null;
  created_at: number;
}
export interface QuoteRow {
  id: string;
  wallet: string;
  dev_buy_lamports: number;
  total_lamports: number;
  created_at: number;
  used: number;
}
export interface ClaimRow {
  id: number;
  sig: string;
  lamports: number;
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
  sweep_sig TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS launch_quotes (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  dev_buy_lamports INTEGER NOT NULL,
  total_lamports INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS used_payments (
  sig TEXT PRIMARY KEY,
  ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sig TEXT NOT NULL UNIQUE,
  lamports INTEGER NOT NULL,
  ts INTEGER NOT NULL
);
`;

declare global {
  var __fanspadDb: Promise<Client> | undefined;
}

export function dbUrl() {
  if (serverConfig.tursoUrl) return serverConfig.tursoUrl;
  if (process.env.VERCEL) return ":memory:";
  return `file:${serverConfig.dbPath}`;
}
export const isEphemeralDb = () => dbUrl() === ":memory:";

export function db(): Promise<Client> {
  if (globalThis.__fanspadDb) return globalThis.__fanspadDb;
  globalThis.__fanspadDb = (async () => {
    const u = dbUrl();
    if (u.startsWith("file:")) mkdirSync(dirname(u.slice(5)), { recursive: true });
    const c = createClient({ url: u, authToken: serverConfig.tursoAuthToken || undefined });
    await c.executeMultiple(SCHEMA);
    return c;
  })();
  return globalThis.__fanspadDb;
}

async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  return (await (await db()).execute({ sql, args })).rows as unknown as T[];
}
async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}
async function run(sql: string, args: InArgs = []): Promise<number> {
  return (await (await db()).execute({ sql, args })).rowsAffected;
}

/* quotes */
export const insertQuote = (q: Omit<QuoteRow, "used" | "created_at">) =>
  run("INSERT INTO launch_quotes(id,wallet,dev_buy_lamports,total_lamports,created_at) VALUES(?,?,?,?,?)", [q.id, q.wallet, q.dev_buy_lamports, q.total_lamports, Date.now()]);
export const getQuote = (id: string) => one<QuoteRow>("SELECT * FROM launch_quotes WHERE id=?", [id]);
/** Atomically marks a quote used. False if it was already used. */
export const claimQuote = async (id: string) => (await run("UPDATE launch_quotes SET used=1 WHERE id=? AND used=0", [id])) === 1;
/** Records a payment signature. False if this payment was already spent on a launch. */
export const spendPayment = async (sig: string) => (await run("INSERT OR IGNORE INTO used_payments(sig,ts) VALUES(?,?)", [sig, Date.now()])) === 1;

/* tokens */
export const insertToken = (t: Omit<TokenRow, "created_at">) =>
  run(
    "INSERT INTO tokens(mint,name,symbol,description,image_url,metadata_uri,launcher_wallet,dev_buy_lamports,create_sig,sweep_sig,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
    [t.mint, t.name, t.symbol, t.description, t.image_url, t.metadata_uri, t.launcher_wallet, t.dev_buy_lamports, t.create_sig, t.sweep_sig, Date.now()],
  );
export const setSweepSig = (mint: string, sig: string) => run("UPDATE tokens SET sweep_sig=? WHERE mint=?", [sig, mint]);
export const listTokens = (limit = 100) => all<TokenRow>("SELECT * FROM tokens ORDER BY created_at DESC LIMIT ?", [limit]);
export const getToken = (mint: string) => one<TokenRow>("SELECT * FROM tokens WHERE mint=?", [mint]);

/* claims */
export const insertClaim = (sig: string, lamports: number) => run("INSERT OR IGNORE INTO claims(sig,lamports,ts) VALUES(?,?,?)", [sig, lamports, Date.now()]);
export const listClaims = (limit = 50) => all<ClaimRow>("SELECT * FROM claims ORDER BY ts DESC LIMIT ?", [limit]);
export const claimTotals = async () =>
  (await one<{ n: number; lamports: number }>("SELECT COUNT(*) AS n, COALESCE(SUM(lamports),0) AS lamports FROM claims"))!;
