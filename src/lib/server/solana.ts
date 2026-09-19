/** Server-side Solana helpers: connection, treasury keypair, payment verification, token sweep. */
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction, type ParsedInstruction } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import bs58 from "bs58";
import { serverConfig } from "./config";
import { TREASURY_ADDRESS } from "../economics";

export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

let conn: Connection | null = null;
export function connection() {
  if (!conn) conn = new Connection(serverConfig.rpcUrl, { commitment: "confirmed" });
  return conn;
}

let treasury: Keypair | null = null;
/**
 * The treasury keypair. Refuses to start if the secret key does not belong to
 * TREASURY_ADDRESS, so creator rewards can never be pointed anywhere else by
 * a misconfigured environment.
 */
export function treasuryKeypair(): Keypair {
  if (!serverConfig.treasurySecretKey) throw new Error("TREASURY_SECRET_KEY is not set");
  if (!treasury) {
    const raw = serverConfig.treasurySecretKey.trim();
    const bytes = raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw) as number[]) : bs58.decode(raw);
    const kp = Keypair.fromSecretKey(bytes);
    if (kp.publicKey.toBase58() !== TREASURY_ADDRESS) {
      throw new Error(`TREASURY_SECRET_KEY belongs to ${kp.publicKey.toBase58()}, expected ${TREASURY_ADDRESS}`);
    }
    treasury = kp;
  }
  return treasury;
}

export const isValidPubkey = (s: string) => {
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
};

export const memoInstruction = (memo: string) => new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(memo, "utf8") });

/** Verify `sig` transferred at least `minLamports` from `from` to the treasury and carried `memo`. */
export async function verifyPayment(sig: string, from: string, minLamports: number, memo: string) {
  let tx;
  try {
    tx = await connection().getParsedTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
  } catch {
    throw new Error("Payment signature is not valid.");
  }
  if (!tx) throw new Error("Payment not found yet. Wait a few seconds and retry.");
  if (tx.meta?.err) throw new Error("Payment transaction failed on chain.");
  let paid = 0;
  let memoSeen = false;
  for (const ix of tx.transaction.message.instructions) {
    const p = ix as ParsedInstruction;
    if (p.program === "system" && p.parsed?.type === "transfer") {
      const info = p.parsed.info as { source: string; destination: string; lamports: number };
      if (info.source === from && info.destination === TREASURY_ADDRESS) paid += Number(info.lamports);
    }
    if (p.program === "spl-memo" && p.parsed === memo) memoSeen = true;
  }
  if (!memoSeen) throw new Error("Payment memo does not match this launch.");
  if (paid < minLamports) throw new Error(`Payment too small: ${paid / LAMPORTS_PER_SOL} SOL, expected ${minLamports / LAMPORTS_PER_SOL} SOL.`);
}

/** Move the treasury's entire balance of `mint` to `owner`. Returns the signature, or null if nothing to move. */
export async function sweepTokensTo(mint: string, owner: string): Promise<string | null> {
  const kp = treasuryKeypair();
  const c = connection();
  const mintPk = new PublicKey(mint);
  const fromAta = getAssociatedTokenAddressSync(mintPk, kp.publicKey);
  let amount = BigInt(0);
  try {
    amount = (await getAccount(c, fromAta)).amount;
  } catch {
    return null;
  }
  if (amount === BigInt(0)) return null;
  const toAta = await getOrCreateAssociatedTokenAccount(c, kp, mintPk, new PublicKey(owner));
  return transfer(c, kp, fromAta, toAta.address, kp, amount);
}

export const treasuryBalance = () => connection().getBalance(new PublicKey(TREASURY_ADDRESS), "confirmed");
