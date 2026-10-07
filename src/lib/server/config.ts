/** Server-only configuration, read from the environment once. */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? n : fallback;
};
const url = (v: string | undefined, fallback: string) => (v && /^https?:\/\//.test(v) ? v : fallback);
const flag = (v: string | undefined) => /^(1|true|yes)$/i.test(v ?? "");

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const serverConfig = {
  rpcUrl: url(process.env.SOLANA_RPC_URL, url(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, "https://api.mainnet-beta.solana.com")),

  /* AI-image gate */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  sightengineUser: process.env.SIGHTENGINE_API_USER ?? "",
  sightengineSecret: process.env.SIGHTENGINE_API_SECRET ?? "",
  /** Block the launch when any detector puts the AI probability at or above this. */
  aiBlockThreshold: Math.min(1, Math.max(0.05, num(process.env.AI_BLOCK_THRESHOLD, 0.5))),
  /** Let launches through with only the metadata/provenance check (no detector API configured). Off by default. */
  allowMetadataOnlyGate: flag(process.env.AI_GATE_ALLOW_METADATA_ONLY),
  /** Secret for signing short-lived verdict tokens. Any random string; falls back to a per-process value. */
  appSecret: process.env.APP_SECRET ?? "",

  /* metadata hosting */
  pinataJwt: process.env.PINATA_JWT ?? "",
  pinataGateway: url(process.env.PINATA_GATEWAY, "https://gateway.pinata.cloud"),

  /* database (optional) */
  tursoUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  dbPath: process.env.DATABASE_PATH ?? "./data/realpad.db",

  /* launch parameters passed to PumpPortal */
  priorityFeeSol: num(process.env.PRIORITY_FEE_SOL, 0.0005),
  maxDevBuySol: num(process.env.MAX_DEV_BUY_SOL, 10),
  slippagePct: num(process.env.SLIPPAGE_PCT, 10),
} as const;
