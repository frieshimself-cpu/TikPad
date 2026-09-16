/**
 * Data layer on libsql (SQLite dialect). One code path for every environment:
 *
 *   - TURSO_DATABASE_URL set      → hosted Turso database (what you want on Vercel)
 *   - otherwise, on Vercel        → in-memory database, re-seeded on every cold start (demo only)
 *   - otherwise                   → local file at DATABASE_PATH
 *
 * Money is stored in lamports (integers) plus a USD-cents snapshot taken at the
 * time of each ledger entry.
 */
import { createClient, type Client, type InArgs, type InStatement } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config";

export type TokenStatus = "pending" | "live" | "failed";

export interface TokenRow {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string | null;
  metadata_uri: string | null;
  recipient_handle: string;
  launcher_wallet: string;
  dev_buy_lamports: number;
  create_sig: string | null;
  status: TokenStatus;
  demo: number;
  created_at: number;
}

export interface CreatorRow {
  id: number;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  tiktok_open_id: string | null;
  payout_wallet: string | null;
  created_at: number;
}

export type LedgerKind = "credit" | "payout" | "protocol";

export interface LedgerRow {
  id: number;
  handle: string;
  mint: string | null;
  kind: LedgerKind;
  lamports: number;
  usd_cents: number;
  ref: string | null;
  ts: number;
}

export interface PayoutRow {
  id: number;
  handle: string;
  wallet: string;
  lamports: number;
  usd_cents: number;
  sig: string;
  milestone_cents: number;
  demo: number;
  ts: number;
}

export interface TradeRow {
  id: number;
  mint: string;
  sig: string;
  side: "buy" | "sell";
  sol_lamports: number;
  trader: string | null;
  ts: number;
  attributed: number;
}

export interface QuoteRow {
  id: string;
  wallet: string;
  handle: string;
  dev_buy_lamports: number;
  total_lamports: number;
  created_at: number;
  used: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tokens (
  mint TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  metadata_uri TEXT,
  recipient_handle TEXT NOT NULL,
  launcher_wallet TEXT NOT NULL,
  dev_buy_lamports INTEGER NOT NULL DEFAULT 0,
  create_sig TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  demo INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tokens_handle ON tokens(recipient_handle);
CREATE TABLE IF NOT EXISTS creators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  tiktok_open_id TEXT UNIQUE,
  payout_wallet TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  sig TEXT NOT NULL UNIQUE,
  side TEXT NOT NULL,
  sol_lamports INTEGER NOT NULL,
  trader TEXT,
  ts INTEGER NOT NULL,
  attributed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS trades_mint ON trades(mint, attributed);
CREATE TABLE IF NOT EXISTS fee_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sig TEXT NOT NULL UNIQUE,
  lamports INTEGER NOT NULL,
  ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL,
  mint TEXT,
  kind TEXT NOT NULL,
  lamports INTEGER NOT NULL,
  usd_cents INTEGER NOT NULL,
  ref TEXT,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_handle ON ledger(handle, kind);
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL,
  wallet TEXT NOT NULL,
  lamports INTEGER NOT NULL,
  usd_cents INTEGER NOT NULL,
  sig TEXT NOT NULL UNIQUE,
  milestone_cents INTEGER NOT NULL,
  demo INTEGER NOT NULL DEFAULT 0,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS payouts_handle ON payouts(handle);
CREATE TABLE IF NOT EXISTS launch_quotes (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  handle TEXT NOT NULL,
  dev_buy_lamports INTEGER NOT NULL,
  total_lamports INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

declare global {
  var __tikpadDb: Promise<Client> | undefined;
}

export function dbUrl(): string {
  if (config.tursoUrl) return config.tursoUrl;
  if (process.env.VERCEL) return ":memory:";
  return `file:${config.dbPath}`;
}

export const isEphemeralDb = () => dbUrl() === ":memory:";

export function db(): Promise<Client> {
  if (globalThis.__tikpadDb) return globalThis.__tikpadDb;
  globalThis.__tikpadDb = (async () => {
    const url = dbUrl();
    if (url.startsWith("file:")) mkdirSync(dirname(url.slice(5)), { recursive: true });
    const client = createClient({ url, authToken: config.tursoAuthToken || undefined });
    await client.executeMultiple(SCHEMA);
    return client;
  })();
  return globalThis.__tikpadDb;
}

/* ---------- tiny query helpers ---------- */
type Row = Record<string, unknown>;
async function all<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  const c = await db();
  const rs = await c.execute({ sql, args });
  return rs.rows as unknown as T[];
}
async function one<T = Row>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}
async function run(sql: string, args: InArgs = []): Promise<number> {
  const c = await db();
  return (await c.execute({ sql, args })).rowsAffected;
}
export async function batch(stmts: InStatement[]) {
  const c = await db();
  return c.batch(stmts, "write");
}

/* ---------- meta ---------- */
export const getMeta = async (key: string) => (await one<{ value: string }>("SELECT value FROM meta WHERE key = ?", [key]))?.value ?? null;
export const setMeta = (key: string, value: string) =>
  run("INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [key, value]);

/* ---------- tokens ---------- */
export function insertTokenStmt(t: Omit<TokenRow, "created_at"> & { created_at?: number }): InStatement {
  return {
    sql: `INSERT INTO tokens(mint,name,symbol,description,image_url,metadata_uri,recipient_handle,launcher_wallet,dev_buy_lamports,create_sig,status,demo,created_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [t.mint, t.name, t.symbol, t.description, t.image_url, t.metadata_uri, t.recipient_handle, t.launcher_wallet, t.dev_buy_lamports, t.create_sig, t.status, t.demo, t.created_at ?? Date.now()],
  };
}
export const insertToken = (t: Omit<TokenRow, "created_at"> & { created_at?: number }) => batch([insertTokenStmt(t)]);
export const updateTokenStatus = (mint: string, status: TokenStatus, create_sig?: string | null) =>
  run("UPDATE tokens SET status=?, create_sig=COALESCE(?, create_sig) WHERE mint=?", [status, create_sig ?? null, mint]);
export const getToken = (mint: string) => one<TokenRow>("SELECT * FROM tokens WHERE mint=?", [mint]);
export const listTokens = (limit = 50) => all<TokenRow>("SELECT * FROM tokens WHERE status='live' ORDER BY created_at DESC LIMIT ?", [limit]);
export const listTokensForHandle = (handle: string) =>
  all<TokenRow>("SELECT * FROM tokens WHERE recipient_handle=? AND status='live' ORDER BY created_at DESC", [handle]);
export const listLiveMints = async () => (await all<{ mint: string }>("SELECT mint FROM tokens WHERE status='live' AND demo=0")).map((r) => r.mint);

/* ---------- creators ---------- */
export const getCreatorByHandle = (handle: string) => one<CreatorRow>("SELECT * FROM creators WHERE handle=?", [handle]);
export const getCreatorById = (id: number) => one<CreatorRow>("SELECT * FROM creators WHERE id=?", [id]);

export function upsertCreatorStmt(c: { handle: string; display_name?: string | null; avatar_url?: string | null; tiktok_open_id?: string | null }): InStatement {
  return {
    sql: `INSERT INTO creators(handle,display_name,avatar_url,tiktok_open_id,created_at) VALUES(?,?,?,?,?)
          ON CONFLICT(handle) DO UPDATE SET
            display_name=COALESCE(excluded.display_name, creators.display_name),
            avatar_url=COALESCE(excluded.avatar_url, creators.avatar_url),
            tiktok_open_id=COALESCE(excluded.tiktok_open_id, creators.tiktok_open_id)`,
    args: [c.handle, c.display_name ?? null, c.avatar_url ?? null, c.tiktok_open_id ?? null, Date.now()],
  };
}
export async function upsertCreator(c: { handle: string; display_name?: string | null; avatar_url?: string | null; tiktok_open_id?: string | null }) {
  await batch([upsertCreatorStmt(c)]);
  return (await getCreatorByHandle(c.handle))!;
}
export const setPayoutWallet = (id: number, wallet: string | null) => run("UPDATE creators SET payout_wallet=? WHERE id=?", [wallet, id]);

/* ---------- trades ---------- */
export const insertTrade = (t: Omit<TradeRow, "id" | "attributed">) =>
  run("INSERT OR IGNORE INTO trades(mint,sig,side,sol_lamports,trader,ts) VALUES(?,?,?,?,?,?)", [t.mint, t.sig, t.side, t.sol_lamports, t.trader, t.ts]);
export const unattributedVolumeByMint = () =>
  all<{ mint: string; vol: number }>("SELECT mint, SUM(sol_lamports) AS vol FROM trades WHERE attributed=0 GROUP BY mint");
export const markTradesAttributed = () => run("UPDATE trades SET attributed=1 WHERE attributed=0");
export const tokenVolume = async (mint: string) =>
  (await one<{ v: number }>("SELECT COALESCE(SUM(sol_lamports),0) AS v FROM trades WHERE mint=?", [mint]))?.v ?? 0;

/* ---------- claims / ledger / payouts ---------- */
export const insertClaim = (sig: string, lamports: number) => run("INSERT OR IGNORE INTO fee_claims(sig,lamports,ts) VALUES(?,?,?)", [sig, lamports, Date.now()]);

export const ledgerStmt = (e: Omit<LedgerRow, "id" | "ts"> & { ts?: number }): InStatement => ({
  sql: "INSERT INTO ledger(handle,mint,kind,lamports,usd_cents,ref,ts) VALUES(?,?,?,?,?,?,?)",
  args: [e.handle, e.mint, e.kind, e.lamports, e.usd_cents, e.ref, e.ts ?? Date.now()],
});
export const insertLedger = (e: Omit<LedgerRow, "id" | "ts"> & { ts?: number }) => batch([ledgerStmt(e)]);

export interface Balance {
  earned_lamports: number;
  earned_cents: number;
  paid_lamports: number;
  paid_cents: number;
  unpaid_lamports: number;
  unpaid_cents: number;
}
export async function balanceForHandle(handle: string): Promise<Balance> {
  const r = (await one<{ earned_lamports: number; earned_cents: number; paid_lamports: number; paid_cents: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN kind='credit' THEN lamports END),0) AS earned_lamports,
       COALESCE(SUM(CASE WHEN kind='credit' THEN usd_cents END),0) AS earned_cents,
       COALESCE(SUM(CASE WHEN kind='payout' THEN lamports END),0) AS paid_lamports,
       COALESCE(SUM(CASE WHEN kind='payout' THEN usd_cents END),0) AS paid_cents
     FROM ledger WHERE handle=?`,
    [handle],
  ))!;
  return { ...r, unpaid_lamports: r.earned_lamports - r.paid_lamports, unpaid_cents: r.earned_cents - r.paid_cents };
}
export const balanceForMint = async (mint: string) =>
  (await one<{ l: number; c: number }>("SELECT COALESCE(SUM(lamports),0) AS l, COALESCE(SUM(usd_cents),0) AS c FROM ledger WHERE mint=? AND kind='credit'", [mint]))!;

export const handlesWithUnpaidBalance = () =>
  all<{ handle: string; unpaid_lamports: number; unpaid_cents: number }>(
    `SELECT handle,
       SUM(CASE WHEN kind='credit' THEN lamports ELSE 0 END) - SUM(CASE WHEN kind='payout' THEN lamports ELSE 0 END) AS unpaid_lamports,
       SUM(CASE WHEN kind='credit' THEN usd_cents ELSE 0 END) - SUM(CASE WHEN kind='payout' THEN usd_cents ELSE 0 END) AS unpaid_cents
     FROM ledger WHERE kind IN ('credit','payout') GROUP BY handle HAVING unpaid_lamports > 0`,
  );

export function payoutStmts(p: Omit<PayoutRow, "id" | "ts"> & { ts?: number }): InStatement[] {
  const ts = p.ts ?? Date.now();
  return [
    {
      sql: "INSERT INTO payouts(handle,wallet,lamports,usd_cents,sig,milestone_cents,demo,ts) VALUES(?,?,?,?,?,?,?,?)",
      args: [p.handle, p.wallet, p.lamports, p.usd_cents, p.sig, p.milestone_cents, p.demo, ts],
    },
    ledgerStmt({ handle: p.handle, mint: null, kind: "payout", lamports: p.lamports, usd_cents: p.usd_cents, ref: p.sig, ts }),
  ];
}
export const insertPayout = (p: Omit<PayoutRow, "id" | "ts"> & { ts?: number }) => batch(payoutStmts(p));
export const listPayouts = (limit = 30) => all<PayoutRow>("SELECT * FROM payouts ORDER BY ts DESC LIMIT ?", [limit]);
export const listPayoutsForHandle = (handle: string, limit = 50) => all<PayoutRow>("SELECT * FROM payouts WHERE handle=? ORDER BY ts DESC LIMIT ?", [handle, limit]);
export const listCreditsForHandle = (handle: string, limit = 50) =>
  all<LedgerRow>("SELECT * FROM ledger WHERE handle=? AND kind='credit' ORDER BY ts DESC LIMIT ?", [handle, limit]);
export const listCreditsForMint = (mint: string, limit = 50) => all<LedgerRow>("SELECT * FROM ledger WHERE mint=? AND kind='credit' ORDER BY ts DESC LIMIT ?", [mint, limit]);

/** Top creators by lifetime earnings. */
export const leaderboard = (limit = 10) =>
  all<{ handle: string; earned_cents: number; earned_lamports: number; token_count: number; avatar_url: string | null; display_name: string | null; linked: number }>(
    `SELECT l.handle, SUM(l.usd_cents) AS earned_cents, SUM(l.lamports) AS earned_lamports,
            (SELECT COUNT(*) FROM tokens t WHERE t.recipient_handle=l.handle AND t.status='live') AS token_count,
            c.avatar_url, c.display_name, (c.payout_wallet IS NOT NULL) AS linked
     FROM ledger l LEFT JOIN creators c ON c.handle=l.handle
     WHERE l.kind='credit' AND l.handle NOT LIKE '\\_\\_%' ESCAPE '\\' GROUP BY l.handle ORDER BY earned_cents DESC LIMIT ?`,
    [limit],
  );

export async function globalStats() {
  const [t, c, p, e] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(*) AS n FROM tokens WHERE status='live'"),
    one<{ n: number }>("SELECT COUNT(DISTINCT handle) AS n FROM ledger WHERE kind='credit'"),
    one<{ cents: number; lamports: number; n: number }>("SELECT COALESCE(SUM(usd_cents),0) AS cents, COALESCE(SUM(lamports),0) AS lamports, COUNT(*) AS n FROM payouts"),
    one<{ cents: number }>("SELECT COALESCE(SUM(usd_cents),0) AS cents FROM ledger WHERE kind='credit'"),
  ]);
  return { tokens: t!.n, creators: c!.n, paid_cents: p!.cents, paid_lamports: p!.lamports, payouts: p!.n, earned_cents: e!.cents };
}

/* ---------- launch quotes ---------- */
export const insertQuote = (q: Omit<QuoteRow, "used" | "created_at">) =>
  run("INSERT INTO launch_quotes(id,wallet,handle,dev_buy_lamports,total_lamports,created_at) VALUES(?,?,?,?,?,?)", [
    q.id, q.wallet, q.handle, q.dev_buy_lamports, q.total_lamports, Date.now(),
  ]);
export const getQuote = (id: string) => one<QuoteRow>("SELECT * FROM launch_quotes WHERE id=?", [id]);
/** Marks a quote used. Returns false if it was already used (atomic, so a quote cannot be spent twice). */
export const claimQuote = async (id: string) => (await run("UPDATE launch_quotes SET used=1 WHERE id=? AND used=0", [id])) === 1;

/** Unified activity feed for the landing page: payouts + fee credits + launches, newest first. */
export interface FeedItem {
  kind: "payout" | "credit" | "launch";
  handle: string;
  mint: string | null;
  symbol: string | null;
  lamports: number;
  usd_cents: number;
  ref: string | null;
  demo: number;
  ts: number;
}
export const activityFeed = (limit = 40) =>
  all<FeedItem>(
    `SELECT * FROM (
       SELECT 'payout' AS kind, handle, NULL AS mint, NULL AS symbol, lamports, usd_cents, sig AS ref, demo, ts FROM payouts
       UNION ALL
       SELECT 'credit', l.handle, l.mint, t.symbol, l.lamports, l.usd_cents, l.ref, COALESCE(t.demo,0), l.ts
         FROM ledger l LEFT JOIN tokens t ON t.mint=l.mint WHERE l.kind='credit'
       UNION ALL
       SELECT 'launch', recipient_handle, mint, symbol, dev_buy_lamports, 0, create_sig, demo, created_at FROM tokens WHERE status='live'
     ) ORDER BY ts DESC LIMIT ?`,
    [limit],
  );
