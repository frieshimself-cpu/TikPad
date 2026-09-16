import { config } from "./config";

let cache: { usd: number; at: number } | null = null;

/** SOL/USD from CoinGecko, cached for 60s, with an env fallback. */
export async function solUsd(): Promise<number> {
  if (cache && Date.now() - cache.at < 60_000) return cache.usd;
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
      signal: AbortSignal.timeout(5000),
    });
    const j = (await res.json()) as { solana?: { usd?: number } };
    if (j.solana?.usd) {
      cache = { usd: j.solana.usd, at: Date.now() };
      return cache.usd;
    }
  } catch {
    /* fall through */
  }
  return cache?.usd ?? config.fallbackSolUsd;
}

export const lamportsToCents = (lamports: number, usd: number) => Math.round((lamports / 1e9) * usd * 100);
