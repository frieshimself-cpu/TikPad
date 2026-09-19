/** Server-only configuration, read from the environment once. */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? n : fallback;
};
const url = (v: string | undefined, fallback: string) => (v && /^https?:\/\//.test(v) ? v : fallback);

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const serverConfig = {
  rpcUrl: url(process.env.SOLANA_RPC_URL, url(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, "https://api.mainnet-beta.solana.com")),
  /** Base58 (Phantom export) or JSON byte array (solana-keygen) secret key of the treasury wallet. */
  treasurySecretKey: process.env.TREASURY_SECRET_KEY ?? "",
  pinataJwt: process.env.PINATA_JWT ?? "",
  pinataGateway: url(process.env.PINATA_GATEWAY, "https://gateway.pinata.cloud"),
  tursoUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  dbPath: process.env.DATABASE_PATH ?? "./data/fanspad.db",
  cronSecret: process.env.CRON_SECRET ?? "",
  /** SOL reserved to cover pump.fun account creation + priority fees for a launch. */
  launchNetworkLamports: num(process.env.LAUNCH_NETWORK_LAMPORTS, 0.03 * LAMPORTS_PER_SOL),
  /** Flat fee kept per launch, in lamports (default 0). */
  launchFeeLamports: num(process.env.LAUNCH_FEE_LAMPORTS, 0),
  priorityFeeSol: num(process.env.PRIORITY_FEE_SOL, 0.0005),
  maxDevBuySol: num(process.env.MAX_DEV_BUY_SOL, 10),
  slippagePct: num(process.env.SLIPPAGE_PCT, 10),
} as const;

export const isLaunchConfigured = () => !!(serverConfig.treasurySecretKey && serverConfig.pinataJwt);
