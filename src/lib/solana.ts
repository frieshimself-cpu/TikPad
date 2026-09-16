/**
 * Server-side Solana helpers: RPC connection, treasury keypair, payment
 * verification and SOL / SPL transfers.
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type ParsedInstruction,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, getAccount, transfer } from "@solana/spl-token";
import bs58 from "bs58";
import { config } from "./config";

export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

let conn: Connection | null = null;
export function connection() {
  if (!conn) conn = new Connection(config.rpcUrl, { commitment: "confirmed" });
  return conn;
}

let treasury: Keypair | null = null;
export function treasuryKeypair(): Keypair {
  if (!config.treasurySecretKey) throw new Error("TREASURY_SECRET_KEY is not set");
  if (!treasury) {
    const raw = config.treasurySecretKey.trim();
    const bytes = raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw) as number[]) : bs58.decode(raw);
    treasury = Keypair.fromSecretKey(bytes);
  }
  return treasury;
}

/** Treasury address for display. Works in demo mode too (falls back to env / placeholder). */
export function treasuryAddress(): string {
  if (config.treasurySecretKey) return treasuryKeypair().publicKey.toBase58();
  if (config.treasuryPublicKey) return config.treasuryPublicKey;
  return "TikPadDemoTreasury11111111111111111111111111";
}

export const isValidPubkey = (s: string) => {
  try {
    return PublicKey.isOnCurve(new PublicKey(s).toBytes()) || true;
  } catch {
    return false;
  }
};

export const memoInstruction = (memo: string) =>
  new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(memo, "utf8") });

/**
 * Verify that `sig` is a confirmed transaction that transferred at least
 * `minLamports` from `from` to the treasury and carried `memo`.
 */
export async function verifyPayment(sig: string, from: string, minLamports: number, memo: string): Promise<void> {
  const tx = await connection().getParsedTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
  if (!tx) throw new Error("Payment transaction not found yet. Wait a few seconds and retry.");
  if (tx.meta?.err) throw new Error("Payment transaction failed on chain.");

  const to = treasuryKeypair().publicKey.toBase58();
  let paid = 0;
  let memoSeen = false;
  for (const ix of tx.transaction.message.instructions) {
    const p = ix as ParsedInstruction;
    if (p.program === "system" && p.parsed?.type === "transfer") {
      const info = p.parsed.info as { source: string; destination: string; lamports: number };
      if (info.source === from && info.destination === to) paid += Number(info.lamports);
    }
    if (p.program === "spl-memo" && typeof p.parsed === "string" && p.parsed === memo) memoSeen = true;
    if (p.programId?.toBase58?.() === MEMO_PROGRAM_ID.toBase58() && typeof p.parsed === "string" && p.parsed === memo) memoSeen = true;
  }
  if (!memoSeen) throw new Error("Payment memo does not match this launch quote.");
  if (paid < minLamports) throw new Error(`Payment too small: got ${paid / LAMPORTS_PER_SOL} SOL, expected ${minLamports / LAMPORTS_PER_SOL} SOL.`);
}

/** Send SOL from the treasury. Returns the signature. */
export async function sendSol(to: string, lamports: number, memo?: string): Promise<string> {
  const kp = treasuryKeypair();
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: new PublicKey(to), lamports }),
  );
  if (memo) tx.add(memoInstruction(memo));
  const c = connection();
  const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = kp.publicKey;
  tx.sign(kp);
  const sig = await c.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await c.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

/** Move the treasury's entire balance of `mint` to `owner`. Returns the signature or null when there is nothing to move. */
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

export const treasuryBalance = () => connection().getBalance(treasuryKeypair().publicKey, "confirmed");
