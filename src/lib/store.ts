"use client";

/**
 * Browser-side preview state for the campaign pages. Stands in for the ad
 * backend until it is connected: launched coins, fee credits into each
 * coin's ad budget, and campaigns run from that budget.
 */
import { useSyncExternalStore } from "react";
import { feeTag } from "./handle";
import { AD_BUDGET_BPS, CAMPAIGN_TYPES, SOL_USD, type CampaignType } from "./economics";

const STORAGE_KEY = "adpad-preview-v1";
const TICK_MS = 20_000;

export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string | null;
  x_handle: string | null;
  launcher_wallet: string;
  dev_buy_lamports: number;
  created_at: number;
}
export interface Credit {
  id: string;
  mint: string;
  lamports: number;
  usd_cents: number;
  ts: number;
}
export interface Campaign {
  id: string;
  mint: string;
  type: CampaignType;
  usd_cents: number;
  impressions: number;
  status: "live" | "done";
  ts: number;
}
export interface State {
  tokens: Token[];
  credits: Credit[];
  campaigns: Campaign[];
  lastTick: number;
}
export interface FeedItem {
  kind: "campaign" | "credit" | "launch";
  id: string;
  mint: string;
  symbol: string;
  label: string;
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

/* ---------------- seed (fictional coins) ---------------- */
const SEED_TOKENS = [
  ["Moon Cat", "MCAT", "mooncatsol"],
  ["Pixel Pepe", "PPEPE", "pixelpepe"],
  ["Solana Toast", "TOAST", "solanatoast"],
  ["Night Owl", "OWL", "nightowlcoin"],
  ["Rocket Rat", "RRAT", "rocketrat"],
  ["Glass Frog", "FROG", "glassfrogsol"],
  ["Orbit", "ORBIT", "orbitonsol"],
  ["Jelly", "JELLY", "jellycoin"],
] as const;

function seed(now: number): State {
  const rand = rng(7);
  const s: State = { tokens: [], credits: [], campaigns: [], lastTick: now };
  SEED_TOKENS.forEach(([name, symbol, x], i) => {
    const mint = b58(rand);
    const created = now - (SEED_TOKENS.length - i) * 6 * 3600_000 - rand() * 3600_000;
    s.tokens.push({
      mint,
      name,
      symbol,
      description: `${name} — community coin.\n\n${feeTag()}`,
      image_url: null,
      x_handle: x,
      launcher_wallet: b58(rand),
      dev_buy_lamports: Math.round((0.2 + rand() * 1.5) * 1e9),
      created_at: created,
    });
    const n = 3 + Math.floor(rand() * 6);
    let budget = 0;
    for (let k = 0; k < n; k++) {
      const lamports = Math.round((0.02 + rand() * 0.6) * 1e9);
      budget += cents(lamports);
      s.credits.push({ id: `s${i}-${k}`, mint, lamports, usd_cents: cents(lamports), ts: created + ((k + 1) * (now - created)) / (n + 1) });
    }
    const runs = Math.floor(rand() * 3);
    for (let k = 0; k < runs; k++) {
      const spend = Math.round(budget * (0.15 + rand() * 0.25));
      s.campaigns.push({
        id: `c${i}-${k}`,
        mint,
        type: CAMPAIGN_TYPES[Math.floor(rand() * CAMPAIGN_TYPES.length)],
        usd_cents: spend,
        impressions: Math.round(spend * (40 + rand() * 80)),
        status: k === runs - 1 && rand() > 0.5 ? "live" : "done",
        ts: now - rand() * 8 * 3600_000,
      });
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
    /* quota or private mode */
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

/* ---------------- derived ---------------- */
export const getToken = (s: State, mint: string) => s.tokens.find((t) => t.mint === mint);
export const creditsFor = (s: State, mint: string) => s.credits.filter((c) => c.mint === mint).sort((a, b) => b.ts - a.ts);
export const campaignsFor = (s: State, mint: string) => s.campaigns.filter((c) => c.mint === mint).sort((a, b) => b.ts - a.ts);

export function budgetFor(s: State, mint: string) {
  const earned = s.credits.filter((c) => c.mint === mint).reduce((a, c) => ({ l: a.l + c.lamports, c: a.c + c.usd_cents }), { l: 0, c: 0 });
  const spent = s.campaigns.filter((c) => c.mint === mint).reduce((a, c) => a + c.usd_cents, 0);
  return { earned_lamports: earned.l, earned_cents: earned.c, spent_cents: spent, available_cents: earned.c - spent };
}

export function feed(s: State, limit = 40): FeedItem[] {
  const sym = (mint: string) => getToken(s, mint)?.symbol ?? "?";
  const items: FeedItem[] = [
    ...s.campaigns.map((c) => ({ kind: "campaign" as const, id: `c-${c.id}`, mint: c.mint, symbol: sym(c.mint), label: c.type, lamports: 0, usd_cents: c.usd_cents, ts: c.ts })),
    ...s.credits.map((c) => ({ kind: "credit" as const, id: `f-${c.id}`, mint: c.mint, symbol: sym(c.mint), label: "fees → ad budget", lamports: c.lamports, usd_cents: c.usd_cents, ts: c.ts })),
    ...s.tokens.map((t) => ({ kind: "launch" as const, id: `l-${t.mint}`, mint: t.mint, symbol: t.symbol, label: "launched", lamports: t.dev_buy_lamports, usd_cents: 0, ts: t.created_at })),
  ];
  return items.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

export function stats(s: State) {
  return {
    tokens: s.tokens.length,
    budget_cents: s.credits.reduce((a, c) => a + c.usd_cents, 0),
    spent_cents: s.campaigns.reduce((a, c) => a + c.usd_cents, 0),
    campaigns: s.campaigns.length,
    impressions: s.campaigns.reduce((a, c) => a + c.impressions, 0),
  };
}

export function leaderboard(s: State, limit = 8) {
  return s.tokens
    .map((t) => ({ ...t, ...budgetFor(s, t.mint), campaigns: campaignsFor(s, t.mint).length }))
    .sort((a, b) => b.earned_cents - a.earned_cents)
    .slice(0, limit);
}

/* ---------------- actions ---------------- */
export function recordLaunch(input: { mint: string; name: string; symbol: string; description: string; x_handle: string | null; wallet: string; image_url: string | null; devBuySol: number }) {
  const s = load();
  const token: Token = {
    mint: input.mint,
    name: input.name,
    symbol: input.symbol.toUpperCase(),
    description: input.description,
    image_url: input.image_url,
    x_handle: input.x_handle,
    launcher_wallet: input.wallet,
    dev_buy_lamports: Math.round(input.devBuySol * 1e9),
    created_at: Date.now(),
  };
  commit({ ...s, tokens: [token, ...s.tokens.filter((t) => t.mint !== token.mint)] });
  return token;
}

/** Simulate a fee claim on a random coin (its ad-budget share), and occasionally run a campaign from a budget. */
export function tick(force = false) {
  const s = load();
  if (!force && Date.now() - s.lastTick < TICK_MS) return;
  if (s.tokens.length === 0) return;
  const t = s.tokens[Math.floor(Math.random() * s.tokens.length)];
  const claimed = Math.round((0.01 + Math.random() * 0.2) * 1e9);
  const lamports = Math.floor((claimed * AD_BUDGET_BPS) / 10_000);
  const credits = [...s.credits, { id: uid(), mint: t.mint, lamports, usd_cents: cents(lamports), ts: Date.now() }];
  let campaigns = s.campaigns;
  const b = budgetFor({ ...s, credits }, t.mint);
  if (b.available_cents > 2000 && Math.random() < 0.35) {
    const spend = Math.round(b.available_cents * (0.3 + Math.random() * 0.4));
    campaigns = [...campaigns, { id: uid(), mint: t.mint, type: CAMPAIGN_TYPES[Math.floor(Math.random() * CAMPAIGN_TYPES.length)], usd_cents: spend, impressions: Math.round(spend * (40 + Math.random() * 80)), status: "live", ts: Date.now() }];
  }
  commit({ ...s, lastTick: Date.now(), credits, campaigns });
}

export function startSimulation() {
  const id = setInterval(() => tick(), 5_000);
  return () => clearInterval(id);
}
