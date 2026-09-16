/**
 * TikPad fee router.
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
 * In demo mode (no TREASURY_SECRET_KEY) it simulates fee claims so the UI has
 * something to show. Set DEMO_SIMULATE=0 to disable that.
 */
import "dotenv/config";
import WebSocket from "ws";
import { config, isDemoMode } from "../src/lib/config";
import { ready } from "../src/lib/bootstrap";
import { insertTrade, listLiveMints, listTokens } from "../src/lib/db";
import { collectCreatorFees } from "../src/lib/pumpportal";
import { attributeClaim, runPayouts } from "../src/lib/router";

const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

/* ---------------- trade stream ---------------- */
let ws: WebSocket | null = null;
let subscribed = new Set<string>();

function connectStream() {
  ws = new WebSocket("wss://pumpportal.fun/api/data");
  ws.on("open", () => {
    log("trade stream connected");
    subscribed = new Set();
    resubscribe();
  });
  ws.on("message", (buf) => {
    try {
      const m = JSON.parse(buf.toString()) as {
        txType?: string;
        mint?: string;
        signature?: string;
        solAmount?: number;
        traderPublicKey?: string;
      };
      if ((m.txType === "buy" || m.txType === "sell") && m.mint && m.signature && typeof m.solAmount === "number") {
        insertTrade({
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

function resubscribe() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const mints = listLiveMints().filter((m) => !subscribed.has(m));
  if (mints.length === 0) return;
  ws.send(JSON.stringify({ method: "subscribeTokenTrade", keys: mints }));
  for (const m of mints) subscribed.add(m);
  log(`subscribed to ${mints.length} new mint(s), ${subscribed.size} total`);
}

/* ---------------- claim + payout cycle ---------------- */
async function cycle() {
  try {
    if (isDemoMode()) {
      if (process.env.DEMO_SIMULATE === "0") return;
      // Pretend a claim happened and spread it over a random live token.
      const tokens = listTokens(50);
      if (tokens.length === 0) return;
      const t = tokens[Math.floor(Math.random() * tokens.length)];
      const lamports = Math.round((0.01 + Math.random() * 0.2) * 1e9);
      insertTrade({ mint: t.mint, sig: `demo-trade-${Date.now()}`, side: "buy", sol_lamports: lamports * 300, trader: null, ts: Date.now() });
      const r = await attributeClaim(`demo-claim-${Date.now()}`, lamports);
      log(`[demo] simulated claim of ${lamports / 1e9} SOL, credited ${r.credited / 1e9} SOL`);
    } else {
      const { signature, lamports } = await collectCreatorFees();
      log(`claimed ${lamports / 1e9} SOL creator fees in ${signature}`);
      const r = await attributeClaim(signature, lamports);
      log(`credited ${r.credited / 1e9} SOL to creators`);
    }
    const paid = await runPayouts(log);
    if (paid.length) log(`sent ${paid.length} payout(s)`);
  } catch (e) {
    log("cycle failed:", e instanceof Error ? e.message : e);
  }
}

async function main() {
  ready();
  log(`TikPad worker starting (${isDemoMode() ? "DEMO" : "LIVE"} mode, interval ${config.workerIntervalMs / 1000}s)`);
  if (!isDemoMode()) connectStream();
  setInterval(resubscribe, 30_000);
  await cycle();
  setInterval(cycle, isDemoMode() ? Math.min(config.workerIntervalMs, 60_000) : config.workerIntervalMs);
}

main();
