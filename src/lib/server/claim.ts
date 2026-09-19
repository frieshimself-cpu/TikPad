/** One claim cycle: collect creator rewards for the treasury and record it. */
import { insertClaim } from "./db";
import { collectCreatorFees } from "./pumpportal";

export async function runClaim(log: (s: string) => void = () => {}) {
  const r = await collectCreatorFees(log);
  if (!r) return { claimed: false as const };
  await insertClaim(r.signature, Math.max(0, r.lamports));
  log(`claimed ${(r.lamports / 1e9).toFixed(6)} SOL in ${r.signature}`);
  return { claimed: true as const, signature: r.signature, lamports: r.lamports };
}
