/**
 * Central configuration. Everything is read from the environment once and
 * exposed as typed constants. When the treasury secret key is missing the app
 * runs in DEMO mode: launches and payouts are simulated so the product can be
 * explored end to end without touching mainnet.
 */

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== "" ? n : fallback;
};

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const config = {
  appName: "TikPad",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  rpcUrl:
    process.env.SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    "https://api.mainnet-beta.solana.com",
  publicRpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com",

  /** Base58 secret key of the treasury wallet (the on-chain creator of every launch). */
  treasurySecretKey: process.env.TREASURY_SECRET_KEY ?? "",
  /** Public address of the treasury. Derived from the secret key when present. */
  treasuryPublicKey: process.env.NEXT_PUBLIC_TREASURY_PUBLIC_KEY ?? "",

  pinataJwt: process.env.PINATA_JWT ?? "",
  pinataGateway: process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud",

  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ?? "",
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",

  sessionSecret: process.env.SESSION_SECRET ?? "",
  dbPath: process.env.DATABASE_PATH ?? "./data/tikpad.db",
  /** Turso (hosted libsql). Needed for persistent data on Vercel. */
  tursoUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  /** Vercel sets this header on cron invocations; protects /api/cron/router. */
  cronSecret: process.env.CRON_SECRET ?? "",

  /** Share of every claimed creator fee that goes to the TikTok creator (bps). */
  creatorShareBps: num(process.env.CREATOR_SHARE_BPS, 8000),
  /** Flat fee TikPad keeps on each launch, in lamports (default 0). */
  launchFeeLamports: num(process.env.LAUNCH_FEE_LAMPORTS, 0),
  /** SOL reserved to cover pump.fun account creation + priority fees for a launch. */
  launchNetworkLamports: num(process.env.LAUNCH_NETWORK_LAMPORTS, 0.03 * LAMPORTS_PER_SOL),
  /** Priority fee passed to PumpPortal, in SOL. */
  priorityFeeSol: num(process.env.PRIORITY_FEE_SOL, 0.0005),
  /** Max dev buy we accept, in SOL. */
  maxDevBuySol: num(process.env.MAX_DEV_BUY_SOL, 5),

  /** Estimated pump.fun creator fee rate on traded SOL volume (bps). Used only to
   *  attribute a claimed lump sum across tokens, never to mint balances. */
  estCreatorFeeBps: num(process.env.EST_CREATOR_FEE_BPS, 30),
  /** Fallback SOL price if the price feed is unreachable. */
  fallbackSolUsd: num(process.env.SOL_USD, 150),

  /** Payout milestones in USD cents. A creator is paid when their unpaid balance crosses the next one. */
  milestonesCents: [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000],
  /** After the last milestone, pay every time the balance crosses this many cents. */
  milestoneStepCents: 100000,

  workerIntervalMs: num(process.env.WORKER_INTERVAL_MS, 5 * 60 * 1000),
} as const;

export const isDemoMode = () => !config.treasurySecretKey;
export const isTikTokConfigured = () => !!(config.tiktokClientKey && config.tiktokClientSecret);

/** The text launchers put in the token description. Tokens carrying this tag register automatically. */
export const feeTag = (handle: string) => `Fees to @${handle} via TikPad`;
export const FEE_TAG_REGEX = /Fees to @([a-z0-9._]{2,24}) via TikPad/i;

export const solToLamports = (sol: number) => Math.round(sol * LAMPORTS_PER_SOL);
export const lamportsToSol = (l: number) => l / LAMPORTS_PER_SOL;
