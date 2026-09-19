"use client";

/**
 * Browser-side state for the front-end preview. Stands in for the database
 * and fee router until the backend (see /backend) is wired up.
 *
 * Everything lives in localStorage: the seeded history, tokens you launch,
 * the creator you sign in as, the wallet you link, and simulated fee claims
 * and payouts that keep the feed moving.
 */
import { useSyncExternalStore } from "react";
import { feeTag } from "./handle";
import { CREATOR_SHARE_BPS, MILESTONES_CENTS, MILESTONE_STEP_CENTS, SOL_USD } from "./economics";
const STORAGE_KEY = "fanspad-preview-v1";
const TICK_MS = 20_000;

export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string | null;
  recipient_handle: string;
  launcher_wallet: string;
  dev_buy_lamports: number;
  created_at: number;
}
export interface Creator {
  handle: string;
  display_name: string;
  avatar_url: string | null;
  payout_wallet: string | null;
}
export interface Credit {
  id: string;
  handle: string;
  mint: string;
  lamports: number;
  usd_cents: number;
  ts: number;
}
export interface Payout {
  id: string;
  handle: string;
  wallet: string;
  lamports: number;
  usd_cents: number;
  milestone_cents: number;
  ts: number;
}
export interface State {
  tokens: Token[];
  creators: Creator[];
  credits: Credit[];
  payouts: Payout[];
  session: string | null;
  lastTick: number;
}
export interface FeedItem {
  kind: "payout" | "credit" | "launch";
  id: string;
  handle: string;
  mint: string | null;
  symbol: string | null;
  lamports: number;
  usd_cents: number;
  ts: number;
}

/* ---------------- helpers ---------------- */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const b58 = (rand: () => number, n = 44) => Array.from({ length: n }, () => B58[Math.floor(rand() * B58.length)]).join("");
export const randomAddress = () => b58(rng(Math.floor(Math.random() * 2 ** 31)), 44);
const cents = (lamports: number) => Math.round((lamports / 1e9) * SOL_USD * 100);
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------- seed ---------------- */
// Fictional handles for the preview. Not real creators.
const SEED_CREATORS = [
  ["lunavale", "Luna Vale"],
  ["mia.rosee", "Mia Rose"],
  ["kenzieblake", "Kenzie Blake"],
  ["sophiexo", "Sophie"],
  ["ivy.lane", "Ivy Lane"],
  ["noahwilde", "Noah Wilde"],
  ["aria_moon", "Aria Moon"],
  ["jade.vip", "Jade"],
] as const;
const SEED_TOKENS = [
  ["Luna Coin", "LUNA", "lunavale"],
  ["Rose", "ROSE", "mia.rosee"],
  ["Kenzie", "KENZ", "kenzieblake"],
  ["Sophie XO", "XO", "sophiexo"],
  ["Ivy", "IVY", "ivy.lane"],
  ["Wilde", "WILDE", "noahwilde"],
  ["Moonlight", "MOON", "aria_moon"],
  ["Jade VIP", "JADE", "jade.vip"],
] as const;

function seed(now: number): State {
  const rand = rng(42);
  const s: State = { tokens: [], creators: [], credits: [], payouts: [], session: null, lastTick: now };
  for (const [handle, name] of SEED_CREATORS) s.creators.push({ handle, display_name: name, avatar_url: null, payout_wallet: null });
  SEED_TOKENS.forEach(([name, symbol, handle], i) => {
    const mint = b58(rand);
    const created = now - (SEED_TOKENS.length - i) * 6 * 3600_000 - rand() * 3600_000;
    s.tokens.push({
      mint,
      name,
      symbol,
      description: `${name} — community token.\n\n${feeTag(handle)}`,
      image_url: null,
      recipient_handle: handle,
      launcher_wallet: b58(rand),
      dev_buy_lamports: Math.round((0.2 + rand() * 1.5) * 1e9),
      created_at: created,
    });
    const n = 3 + Math.floor(rand() * 6);
    let cum = 0;
    for (let k = 0; k < n; k++) {
      const lamports = Math.round((0.02 + rand() * 0.6) * 1e9);
      cum += lamports;
      s.credits.push({ id: `s${i}-${k}`, handle, mint, lamports, usd_cents: cents(lamports), ts: created + ((k + 1) * (now - created)) / (n + 1) });
    }
    if (rand() > 0.35) {
      const lamports = Math.round(cum * (0.5 + rand() * 0.4));
      s.payouts.push({ id: `p${i}`, handle, wallet: b58(rand), lamports, usd_cents: cents(lamports), milestone_cents: 500, ts: now - rand() * 5 * 3600_000 });
    }
  });
  return s;
}

/* ---------------- persistence + subscription ---------------- */
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as State;
  } catch {
    /* ignore */
  }
  if (!state) state = seed(Date.now());
  return state;
}
function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode: keep in memory */
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const getServerSnapshot = () => null;

/** Current state, or null during server render / hydration. */
export function useStore(): State | null {
  return useSyncExternalStore(subscribe, load, getServerSnapshot);
}

export function resetPreview() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  state = null;
  commit(load());
}

/* ---------------- derived ---------------- */
export function nextMilestoneCents(paidCents: number) {
  for (const m of MILESTONES_CENTS) if (m > paidCents) return m;
  const last = MILESTONES_CENTS[MILESTONES_CENTS.length - 1];
  return last + (Math.floor((paidCents - last) / MILESTONE_STEP_CENTS) + 1) * MILESTONE_STEP_CENTS;
}

export function balanceFor(s: State, handle: string) {
  const sum = (xs: { lamports: number; usd_cents: number }[]) => xs.reduce((a, x) => ({ l: a.l + x.lamports, c: a.c + x.usd_cents }), { l: 0, c: 0 });
  const e = sum(s.credits.filter((c) => c.handle === handle));
  const p = sum(s.payouts.filter((c) => c.handle === handle));
  return { earned_lamports: e.l, earned_cents: e.c, paid_lamports: p.l, paid_cents: p.c, unpaid_lamports: e.l - p.l, unpaid_cents: e.c - p.c };
}
export const balanceForMint = (s: State, mint: string) =>
  s.credits.filter((c) => c.mint === mint).reduce((a, c) => ({ l: a.l + c.lamports, c: a.c + c.usd_cents }), { l: 0, c: 0 });

export const tokensFor = (s: State, handle: string) => s.tokens.filter((t) => t.recipient_handle === handle).sort((a, b) => b.created_at - a.created_at);
export const creditsFor = (s: State, handle: string) => s.credits.filter((c) => c.handle === handle).sort((a, b) => b.ts - a.ts);
export const creditsForMint = (s: State, mint: string) => s.credits.filter((c) => c.mint === mint).sort((a, b) => b.ts - a.ts);
export const payoutsFor = (s: State, handle: string) => s.payouts.filter((p) => p.handle === handle).sort((a, b) => b.ts - a.ts);
export const getToken = (s: State, mint: string) => s.tokens.find((t) => t.mint === mint);
export const getCreator = (s: State, handle: string) => s.creators.find((c) => c.handle === handle);
export const me = (s: State) => (s.session ? getCreator(s, s.session) ?? null : null);

export function feed(s: State, limit = 40): FeedItem[] {
  const sym = (mint: string) => getToken(s, mint)?.symbol ?? null;
  const items: FeedItem[] = [
    ...s.payouts.map((p) => ({ kind: "payout" as const, id: `p-${p.id}`, handle: p.handle, mint: null, symbol: null, lamports: p.lamports, usd_cents: p.usd_cents, ts: p.ts })),
    ...s.credits.map((c) => ({ kind: "credit" as const, id: `c-${c.id}`, handle: c.handle, mint: c.mint, symbol: sym(c.mint), lamports: c.lamports, usd_cents: c.usd_cents, ts: c.ts })),
    ...s.tokens.map((t) => ({ kind: "launch" as const, id: `l-${t.mint}`, handle: t.recipient_handle, mint: t.mint, symbol: t.symbol, lamports: t.dev_buy_lamports, usd_cents: 0, ts: t.created_at })),
  ];
  return items.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

export function stats(s: State) {
  return {
    tokens: s.tokens.length,
    creators: new Set(s.credits.map((c) => c.handle)).size,
    paid_cents: s.payouts.reduce((a, p) => a + p.usd_cents, 0),
    payouts: s.payouts.length,
    earned_cents: s.credits.reduce((a, c) => a + c.usd_cents, 0),
  };
}

export function leaderboard(s: State, limit = 6) {
  const by = new Map<string, number>();
  for (const c of s.credits) by.set(c.handle, (by.get(c.handle) ?? 0) + c.usd_cents);
  return [...by.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([handle, earned_cents]) => ({
      handle,
      earned_cents,
      token_count: tokensFor(s, handle).length,
      avatar_url: getCreator(s, handle)?.avatar_url ?? null,
      linked: !!getCreator(s, handle)?.payout_wallet,
    }));
}

/* ---------------- actions ---------------- */
export function launchToken(input: { name: string; symbol: string; description: string; handle: string; devBuySol: number; wallet: string; image_url: string | null }) {
  const s = load();
  const token: Token = {
    mint: randomAddress(),
    name: input.name,
    symbol: input.symbol.toUpperCase(),
    description: `${input.description.trim()}\n\n${feeTag(input.handle)}`.trim(),
    image_url: input.image_url,
    recipient_handle: input.handle,
    launcher_wallet: input.wallet,
    dev_buy_lamports: Math.round(input.devBuySol * 1e9),
    created_at: Date.now(),
  };
  const creators = getCreator(s, input.handle) ? s.creators : [...s.creators, { handle: input.handle, display_name: input.handle, avatar_url: null, payout_wallet: null }];
  commit({ ...s, tokens: [token, ...s.tokens], creators });
  return token;
}

export function signIn(handle: string) {
  const s = load();
  const creators = getCreator(s, handle) ? s.creators : [...s.creators, { handle, display_name: handle, avatar_url: null, payout_wallet: null }];
  commit({ ...s, creators, session: handle });
}
export const signOut = () => commit({ ...load(), session: null });

export function linkWallet(wallet: string | null) {
  const s = load();
  if (!s.session) return;
  commit({ ...s, creators: s.creators.map((c) => (c.handle === s.session ? { ...c, payout_wallet: wallet } : c)) });
  runPayouts();
}

/** Pay every creator who linked a wallet and crossed their next milestone. */
export function runPayouts() {
  const s = load();
  const payouts = [...s.payouts];
  for (const c of s.creators) {
    if (!c.payout_wallet) continue;
    const b = balanceFor({ ...s, payouts }, c.handle);
    if (b.unpaid_lamports <= 0) continue;
    const milestone = nextMilestoneCents(b.paid_cents);
    if (b.paid_cents + b.unpaid_cents < milestone) continue;
    payouts.push({ id: uid(), handle: c.handle, wallet: c.payout_wallet, lamports: b.unpaid_lamports, usd_cents: b.unpaid_cents, milestone_cents: milestone, ts: Date.now() });
  }
  if (payouts.length !== s.payouts.length) commit({ ...s, payouts });
}

/** Simulate a fee claim on a random token (the creator's 80% share), then pay milestones. */
export function tick(force = false) {
  const s = load();
  if (!force && Date.now() - s.lastTick < TICK_MS) return;
  if (s.tokens.length === 0) return;
  const t = s.tokens[Math.floor(Math.random() * s.tokens.length)];
  const claimed = Math.round((0.01 + Math.random() * 0.2) * 1e9);
  const lamports = Math.floor((claimed * CREATOR_SHARE_BPS) / 10_000);
  commit({ ...s, lastTick: Date.now(), credits: [...s.credits, { id: uid(), handle: t.recipient_handle, mint: t.mint, lamports, usd_cents: cents(lamports), ts: Date.now() }] });
  runPayouts();
}

/** Starts the simulation loop for the lifetime of a component. Returns a cleanup function. */
export function startSimulation() {
  const id = setInterval(() => tick(), 5_000);
  return () => clearInterval(id);
}
