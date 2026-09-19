/**
 * Claims creator rewards for the treasury every 2 minutes, across every coin
 * launched from FansPad (one PumpPortal collectCreatorFee tx per cycle).
 *
 *   npm run claimer
 *
 * Needs TREASURY_SECRET_KEY, SOLANA_RPC_URL and (optionally) TURSO_* in .env.
 */
import "dotenv/config";
import { CLAIM_INTERVAL_MS, TREASURY_ADDRESS } from "../src/lib/economics";
import { runClaim } from "../src/lib/server/claim";
import { treasuryKeypair } from "../src/lib/server/solana";

const log = (s: string) => console.log(new Date().toISOString(), s);

async function cycle() {
  try {
    await runClaim(log);
  } catch (e) {
    log(`claim failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main() {
  treasuryKeypair(); // fails fast if the key is missing or belongs to the wrong wallet
  log(`FansPad claimer: treasury ${TREASURY_ADDRESS}, every ${CLAIM_INTERVAL_MS / 1000}s`);
  await cycle();
  setInterval(() => void cycle(), CLAIM_INTERVAL_MS);
}

void main();
