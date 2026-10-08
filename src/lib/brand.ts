/** Brand constants (plain module: safe to import from server and client components). */
export const BRAND = "Anti AI Launchpad";
export const BRAND_SHORT = "AAL";
export const TAGLINE = "Launch on pump.fun. No AI images.";

export const TOKEN_SYMBOL = "AAL";
/** The $AAL token contract address on pump.fun. */
export const TOKEN_CA = "remrgVEa7isr92K7hW1WerSvo9f6MiTxxAMx4S4pump";
export const TOKEN_PUMP_URL = `https://pump.fun/coin/${TOKEN_CA}`;

export const pumpUrl = (mint: string) => `https://pump.fun/coin/${mint}`;

/** Largest coin image we accept (bytes). Keeps every detector within its own upload limit. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
