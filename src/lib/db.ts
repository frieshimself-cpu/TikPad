/**
 * SQLite data layer (better-sqlite3). Single file, synchronous, zero setup.
 * The schema is created on first open. Money is stored in lamports (integers)
 * plus a USD-cents snapshot taken at the time of each ledger entry.
 */
import Database from "better-sqlite3";
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
  var __tikpadDb: Database.Database | undefined;
}

export function db(): Database.Database {
  if (globalThis.__tikpadDb) return globalThis.__tikpadDb;
  mkdirSync(dirname(config.dbPath), { recursive: true });
  const d = new Database(config.dbPath);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.exec(SCHEMA);
  globalThis.__tikpadDb = d;
  return d;
}

/* ---------- meta ---------- */
export const getMeta = (key: string): string | null =>
  (db().prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined)?.value ?? null;
export const setMeta = (key: string, value: string) =>
  db().prepare("INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, value);

/* ---------- tokens ---------- */
export function insertToken(t: Omit<TokenRow, "created_at"> & { created_at?: number }) {
  db()
    .prepare(
      `INSERT INTO tokens(mint,name,symbol,description,image_url,metadata_uri,recipient_handle,launcher_wallet,dev_buy_lamports,create_sig,status,demo,created_at)
       VALUES(@mint,@name,@symbol,@description,@image_url,@metadata_uri,@recipient_handle,@launcher_wallet,@dev_buy_lamports,@create_sig,@status,@demo,@created_at)`,
    )
    .run({ ...t, created_at: t.created_at ?? Date.now() });
}
export const updateTokenStatus = (mint: string, status: TokenStatus, create_sig?: string | null) =>
  db().prepare("UPDATE tokens SET status=?, create_sig=COALESCE(?, create_sig) WHERE mint=?").run(status, create_sig ?? null, mint);
export const getToken = (mint: string) => db().prepare("SELECT * FROM tokens WHERE mint=?").get(mint) as TokenRow | undefined;
export const listTokens = (limit = 50) =>
  db().prepare("SELECT * FROM tokens WHERE status='live' ORDER BY created_at DESC LIMIT ?").all(limit) as TokenRow[];
export const listTokensForHandle = (handle: string) =>
  db().prepare("SELECT * FROM tokens WHERE recipient_handle=? AND status='live' ORDER BY created_at DESC").all(handle) as TokenRow[];
export const listLiveMints = () => (db().prepare("SELECT mint FROM tokens WHERE status='live' AND demo=0").all() as { mint: string }[]).map((r) => r.mint);

/* ---------- creators ---------- */
export const getCreatorByHandle = (handle: string) =>
  db().prepare("SELECT * FROM creators WHERE handle=?").get(handle) as CreatorRow | undefined;
export const getCreatorById = (id: number) => db().prepare("SELECT * FROM creators WHERE id=?").get(id) as CreatorRow | undefined;

export function upsertCreator(c: { handle: string; display_name?: string | null; avatar_url?: string | null; tiktok_open_id?: string | null }) {
  db()
    .prepare(
      `INSERT INTO creators(handle,display_name,avatar_url,tiktok_open_id,created_at)
       VALUES(@handle,@display_name,@avatar_url,@tiktok_open_id,@created_at)
       ON CONFLICT(handle) DO UPDATE SET
         display_name=COALESCE(excluded.display_name, creators.display_name),
         avatar_url=COALESCE(excluded.avatar_url, creators.avatar_url),
         tiktok_open_id=COALESCE(excluded.tiktok_open_id, creators.tiktok_open_id)`,
    )
    .run({ display_name: null, avatar_url: null, tiktok_open_id: null, ...c, created_at: Date.now() });
  return getCreatorByHandle(c.handle)!;
}
export const setPayoutWallet = (id: number, wallet: string | null) =>
  db().prepare("UPDATE creators SET payout_wallet=? WHERE id=?").run(wallet, id);

/* ---------- trades ---------- */
export function insertTrade(t: Omit<TradeRow, "id" | "attributed">) {
  return db()
    .prepare("INSERT OR IGNORE INTO trades(mint,sig,side,sol_lamports,trader,ts) VALUES(@mint,@sig,@side,@sol_lamports,@trader,@ts)")
    .run(t).changes;
}
export const unattributedVolumeByMint = () =>
  db().prepare("SELECT mint, SUM(sol_lamports) AS vol FROM trades WHERE attributed=0 GROUP BY mint").all() as { mint: string; vol: number }[];
export const markTradesAttributed = () => db().prepare("UPDATE trades SET attributed=1 WHERE attributed=0").run();
export const tokenVolume = (mint: string) =>
  ((db().prepare("SELECT COALESCE(SUM(sol_lamports),0) AS v FROM trades WHERE mint=?").get(mint) as { v: number }).v ?? 0);

/* ---------- claims / ledger / payouts ---------- */
export const insertClaim = (sig: string, lamports: number) =>
  db().prepare("INSERT OR IGNORE INTO fee_claims(sig,lamports,ts) VALUES(?,?,?)").run(sig, lamports, Date.now());

export function insertLedger(e: Omit<LedgerRow, "id" | "ts"> & { ts?: number }) {
  db()
    .prepare("INSERT INTO ledger(handle,mint,kind,lamports,usd_cents,ref,ts) VALUES(@handle,@mint,@kind,@lamports,@usd_cents,@ref,@ts)")
    .run({ ...e, ts: e.ts ?? Date.now() });
}

export interface Balance {
  earned_lamports: number;
  earned_cents: number;
  paid_lamports: number;
  paid_cents: number;
  unpaid_lamports: number;
  unpaid_cents: number;
}
export function balanceForHandle(handle: string): Balance {
  const r = db()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN kind='credit' THEN lamports END),0) AS earned_lamports,
         COALESCE(SUM(CASE WHEN kind='credit' THEN usd_cents END),0) AS earned_cents,
         COALESCE(SUM(CASE WHEN kind='payout' THEN lamports END),0) AS paid_lamports,
         COALESCE(SUM(CASE WHEN kind='payout' THEN usd_cents END),0) AS paid_cents
       FROM ledger WHERE handle=?`,
    )
    .get(handle) as { earned_lamports: number; earned_cents: number; paid_lamports: number; paid_cents: number };
  return {
    ...r,
    unpaid_lamports: r.earned_lamports - r.paid_lamports,
    unpaid_cents: r.earned_cents - r.paid_cents,
  };
}
export const balanceForMint = (mint: string) =>
  (db().prepare("SELECT COALESCE(SUM(lamports),0) AS l, COALESCE(SUM(usd_cents),0) AS c FROM ledger WHERE mint=? AND kind='credit'").get(mint) as {
    l: number;
    c: number;
  });

export const handlesWithUnpaidBalance = () =>
  (
    db()
      .prepare(
        `SELECT handle,
           SUM(CASE WHEN kind='credit' THEN lamports ELSE 0 END) - SUM(CASE WHEN kind='payout' THEN lamports ELSE 0 END) AS unpaid_lamports,
           SUM(CASE WHEN kind='credit' THEN usd_cents ELSE 0 END) - SUM(CASE WHEN kind='payout' THEN usd_cents ELSE 0 END) AS unpaid_cents
         FROM ledger WHERE kind IN ('credit','payout') GROUP BY handle HAVING unpaid_lamports > 0`,
      )
      .all() as { handle: string; unpaid_lamports: number; unpaid_cents: number }[]
  );

export function insertPayout(p: Omit<PayoutRow, "id" | "ts"> & { ts?: number }) {
  const ts = p.ts ?? Date.now();
  const tx = db().transaction(() => {
    db()
      .prepare("INSERT INTO payouts(handle,wallet,lamports,usd_cents,sig,milestone_cents,demo,ts) VALUES(@handle,@wallet,@lamports,@usd_cents,@sig,@milestone_cents,@demo,@ts)")
      .run({ ...p, ts });
    insertLedger({ handle: p.handle, mint: null, kind: "payout", lamports: p.lamports, usd_cents: p.usd_cents, ref: p.sig, ts });
  });
  tx();
}
export const listPayouts = (limit = 30) =>
  db().prepare("SELECT * FROM payouts ORDER BY ts DESC LIMIT ?").all(limit) as PayoutRow[];
export const listPayoutsForHandle = (handle: string, limit = 50) =>
  db().prepare("SELECT * FROM payouts WHERE handle=? ORDER BY ts DESC LIMIT ?").all(handle, limit) as PayoutRow[];
export const listCreditsForHandle = (handle: string, limit = 50) =>
  db().prepare("SELECT * FROM ledger WHERE handle=? AND kind='credit' ORDER BY ts DESC LIMIT ?").all(handle, limit) as LedgerRow[];
export const listCreditsForMint = (mint: string, limit = 50) =>
  db().prepare("SELECT * FROM ledger WHERE mint=? AND kind='credit' ORDER BY ts DESC LIMIT ?").all(mint, limit) as LedgerRow[];

/** Top creators by lifetime earnings. */
export const leaderboard = (limit = 10) =>
  db()
    .prepare(
      `SELECT l.handle, SUM(l.usd_cents) AS earned_cents, SUM(l.lamports) AS earned_lamports,
              (SELECT COUNT(*) FROM tokens t WHERE t.recipient_handle=l.handle AND t.status='live') AS token_count,
              c.avatar_url, c.display_name, (c.payout_wallet IS NOT NULL) AS linked
       FROM ledger l LEFT JOIN creators c ON c.handle=l.handle
       WHERE l.kind='credit' GROUP BY l.handle ORDER BY earned_cents DESC LIMIT ?`,
    )
    .all(limit) as {
    handle: string;
    earned_cents: number;
    earned_lamports: number;
    token_count: number;
    avatar_url: string | null;
    display_name: string | null;
    linked: number;
  }[];

export function globalStats() {
  const t = db().prepare("SELECT COUNT(*) AS n FROM tokens WHERE status='live'").get() as { n: number };
  const c = db().prepare("SELECT COUNT(DISTINCT handle) AS n FROM ledger WHERE kind='credit'").get() as { n: number };
  const p = db().prepare("SELECT COALESCE(SUM(usd_cents),0) AS cents, COALESCE(SUM(lamports),0) AS lamports, COUNT(*) AS n FROM payouts").get() as {
    cents: number;
    lamports: number;
    n: number;
  };
  const e = db().prepare("SELECT COALESCE(SUM(usd_cents),0) AS cents FROM ledger WHERE kind='credit'").get() as { cents: number };
  return { tokens: t.n, creators: c.n, paid_cents: p.cents, paid_lamports: p.lamports, payouts: p.n, earned_cents: e.cents };
}

/* ---------- launch quotes ---------- */
export const insertQuote = (q: Omit<QuoteRow, "used" | "created_at">) =>
  db()
    .prepare("INSERT INTO launch_quotes(id,wallet,handle,dev_buy_lamports,total_lamports,created_at) VALUES(@id,@wallet,@handle,@dev_buy_lamports,@total_lamports,@created_at)")
    .run({ ...q, created_at: Date.now() });
export const getQuote = (id: string) => db().prepare("SELECT * FROM launch_quotes WHERE id=?").get(id) as QuoteRow | undefined;
export const markQuoteUsed = (id: string) => db().prepare("UPDATE launch_quotes SET used=1 WHERE id=?").run(id);

/** Unified activity feed for the landing page: payouts + fee credits, newest first. */
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
export function activityFeed(limit = 40): FeedItem[] {
  return db()
    .prepare(
      `SELECT * FROM (
         SELECT 'payout' AS kind, handle, NULL AS mint, NULL AS symbol, lamports, usd_cents, sig AS ref, demo, ts FROM payouts
         UNION ALL
         SELECT 'credit', l.handle, l.mint, t.symbol, l.lamports, l.usd_cents, l.ref, t.demo, l.ts
           FROM ledger l LEFT JOIN tokens t ON t.mint=l.mint WHERE l.kind='credit'
         UNION ALL
         SELECT 'launch', recipient_handle, mint, symbol, dev_buy_lamports, 0, create_sig, demo, created_at FROM tokens WHERE status='live'
       ) ORDER BY ts DESC LIMIT ?`,
    )
    .all(limit) as FeedItem[];
}
