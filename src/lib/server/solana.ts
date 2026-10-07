/** Server-side Solana helpers: a shared connection and on-chain verification of a launch. */
import { Connection, PublicKey } from "@solana/web3.js";
import { serverConfig } from "./config";

let conn: Connection | null = null;
export function connection() {
  if (!conn) conn = new Connection(serverConfig.rpcUrl, { commitment: "confirmed" });
  return conn;
}

export const isValidPubkey = (s: string) => {
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
};

const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

/**
 * Confirm that `sig` is a successful transaction, paid for by `wallet`, that
 * touches `mint` and the pump.fun program. Retries briefly because the RPC
 * can lag the wallet's own confirmation by a few seconds.
 */
export async function verifyCreateTx(sig: string, mint: string, wallet: string): Promise<boolean> {
  const c = connection();
  for (let attempt = 0; attempt < 6; attempt++) {
    const tx = await c.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" }).catch(() => null);
    if (tx) {
      if (tx.meta?.err) return false;
      const keys = tx.transaction.message.staticAccountKeys.map((k) => k.toBase58());
      return keys[0] === wallet && keys.includes(mint) && keys.includes(PUMP_PROGRAM);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
