/** Shared economics constants (plain module: safe to import from server and client components). */
/** Share of claimed creator rewards that goes into the coin's ad budget (the rest covers AdPad's costs). */
export const AD_BUDGET_BPS = 9000;
export const SOL_USD = 150;

/** The AdPad token contract address on pump.fun. */
export const ADPAD_CA = "BKKJwFywQbRNMnhviP5XvqEuRXytyES7Nz2f4Cvopump";
export const ADPAD_PUMP_URL = `https://pump.fun/coin/${ADPAD_CA}`;

/** Every coin launched here is created on-chain by this wallet, so 100% of creator rewards accrue to it. */
export const TREASURY_ADDRESS = "aCKyUCgUMfeScz1M9AsMzGZcJxB2EikTGgaftromUz1";
/** How often the treasury claims creator rewards. */
export const CLAIM_INTERVAL_MS = 2 * 60 * 1000;

export const CAMPAIGN_TYPES = ["X promoted post", "KOL promo", "X trend push", "Telegram promo", "DEX banner"] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];
