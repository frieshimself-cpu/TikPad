/** Shared economics constants (plain module: safe to import from server and client components). */
export const CREATOR_SHARE_BPS = 8000;
export const MILESTONES_CENTS = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];
export const MILESTONE_STEP_CENTS = 100000;
export const SOL_USD = 150;


/** Every coin launched here is created on-chain by this wallet, so 100% of creator rewards accrue to it. */
export const TREASURY_ADDRESS = "aCKyUCgUMfeScz1M9AsMzGZcJxB2EikTGgaftromUz1";
/** How often the treasury claims creator rewards. */
export const CLAIM_INTERVAL_MS = 2 * 60 * 1000;

/** The FansPad token contract address on pump.fun. */
export const FANSPAD_CA = "6woVtnriMjwmfUUUAJJpB6pyztYuyk5DGw9TXNFZpump";
export const FANSPAD_PUMP_URL = `https://pump.fun/coin/${FANSPAD_CA}`;
