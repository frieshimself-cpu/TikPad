/**
 * TikPad fee router (long-running process).
 *
 *   npm run worker
 *
 * Loop:
 *   - stream trades for every live token from PumpPortal's websocket and record
 *     traded SOL volume per mint (used for attribution)
 *   - every WORKER_INTERVAL_MS: claim creator fees to the treasury, attribute the
 *     claimed SOL across tokens pro-rata by volume, credit creators, then pay
 *     anyone who crossed a milestone and has a wallet linked.
 *
 * On Vercel the same cycle runs from /api/cron/router instead (no streaming).
 * In demo mode (no TREASURY_SECRET_KEY) fee claims are simulated; set
 * DEMO_SIMULATE=0 to disable that.
 */
import "dotenv/config";
import WebSocket from "ws";
import { config, isDemoMode } from "../src/lib/config";
import { ready } from "../src/lib/bootstrap";
import { insertTrade, listLiveMints } from "../src/lib/db";
import { runCycle } from "../src/lib/router";

const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

/* ---------------- trade stream ---------------- */
let ws: WebSocket | null = null;
let subscribed = new Set<string>();

function connectStream() {
  ws = new WebSocket("wss://pumpportal.fun/api/data");
  ws.on("open", () => {
    log("trade stream connected");
    subscribed = new Set();
    void resubscribe();
  });
  ws.on("message", (buf) => {
    try {
      const m = JSON.parse(buf.toString()) as { txType?: string; mint?: string; signature?: string; solAmount?: number; traderPublicKey?: string };
      if ((m.txType === "buy" || m.txType === "sell") && m.mint && m.signature && typeof m.solAmount === "number") {
        void insertTrade({
          mint: m.mint,
          sig: m.signature,
          side: m.txType,
          sol_lamports: Math.round(m.solAmount * 1e9),
          trader: m.traderPublicKey ?? null,
          ts: Date.now(),
        });
      }
    } catch {
      /* ignore malformed */
    }
  });
  ws.on("close", () => {
    log("trade stream closed, reconnecting in 5s");
    setTimeout(connectStream, 5000);
  });
  ws.on("error", (e) => log("trade stream error", e.message));
}

async function resubscribe() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const mints = (await listLiveMints()).filter((m) => !subscribed.has(m));
  if (mints.length === 0) return;
  ws.send(JSON.stringify({ method: "subscribeTokenTrade", keys: mints }));
  for (const m of mints) subscribed.add(m);
  log(`subscribed to ${mints.length} new mint(s), ${subscribed.size} total`);
}

async function cycle() {
  if (isDemoMode() && process.env.DEMO_SIMULATE === "0") return;
  try {
    await runCycle(log);
  } catch (e) {
    log("cycle failed:", e instanceof Error ? e.message : e);
  }
}

async function main() {
  await ready();
  log(`TikPad worker starting (${isDemoMode() ? "DEMO" : "LIVE"} mode, interval ${config.workerIntervalMs / 1000}s)`);
  if (!isDemoMode()) connectStream();
  setInterval(() => void resubscribe(), 30_000);
  await cycle();
  setInterval(() => void cycle(), isDemoMode() ? Math.min(config.workerIntervalMs, 60_000) : config.workerIntervalMs);
}

void main();
