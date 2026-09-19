"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Buffer } from "buffer";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { fmtSol, short } from "@/lib/format";
import { TREASURY_ADDRESS } from "@/lib/economics";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

interface Status {
  launchEnabled: boolean;
  treasury: string;
  networkLamports: number;
  feeLamports: number;
  maxDevBuySol: number;
}
interface Quote {
  id: string;
  memo: string;
  treasury: string;
  dev_buy_lamports: number;
  network_lamports: number;
  fee_lamports: number;
  total_lamports: number;
}
interface Result {
  mint: string;
  signature: string;
  sweepSig: string | null;
  imageUrl: string | null;
}
type Step = "form" | "quoting" | "paying" | "launching" | "done";

export function LaunchForm() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [status, setStatus] = useState<Status | null>(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [devBuy, setDevBuy] = useState("0.1");
  const [image, setImage] = useState<File | null>(null);
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => r.json() as Promise<Status>)
      .then((s) => alive && setStatus(s))
      .catch(() => alive && setStatus({ launchEnabled: false, treasury: TREASURY_ADDRESS, networkLamports: 0.03e9, feeLamports: 0, maxDevBuySol: 10 }));
    return () => {
      alive = false;
    };
  }, []);

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  const devBuyNum = Number(devBuy) || 0;
  const networkLamports = status?.networkLamports ?? 0.03e9;
  const feeLamports = status?.feeLamports ?? 0;
  const total = devBuyNum * 1e9 + networkLamports + feeLamports;
  const enabled = status?.launchEnabled ?? false;
  const busy = step !== "form";
  const canSubmit = enabled && !busy && name.trim().length > 0 && /^[A-Za-z0-9]{1,10}$/.test(symbol.trim()) && !!image && devBuyNum <= (status?.maxDevBuySol ?? 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!publicKey) {
      setVisible(true);
      return;
    }
    try {
      // 1. Quote
      setStep("quoting");
      const qr = await fetch("/api/launch/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58(), devBuySol: devBuyNum }),
      });
      const q = (await qr.json()) as Quote & { error?: string };
      if (!qr.ok) throw new Error(q.error ?? "Could not get a quote.");

      // 2. Pay the treasury (dev buy + creation reserve), memo ties the payment to this quote
      setStep("paying");
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(q.treasury), lamports: q.total_lamports }),
        new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(q.memo, "utf8") }),
      );
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const paymentSig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: paymentSig, blockhash, lastValidBlockHeight }, "confirmed");

      // 3. Create the coin (treasury is the on-chain creator)
      setStep("launching");
      const fd = new FormData();
      fd.set("quoteId", q.id);
      fd.set("paymentSig", paymentSig);
      fd.set("name", name.trim());
      fd.set("symbol", symbol.trim().toUpperCase());
      fd.set("description", description.trim());
      fd.set("wallet", publicKey.toBase58());
      if (twitter.trim()) fd.set("twitter", twitter.trim());
      if (telegram.trim()) fd.set("telegram", telegram.trim());
      if (website.trim()) fd.set("website", website.trim());
      fd.set("image", image!);
      const lr = await fetch("/api/launch", { method: "POST", body: fd });
      const res = (await lr.json()) as Result & { error?: string };
      if (!lr.ok) throw new Error(res.error ?? "Launch failed.");
      setResult(res);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("form");
    }
  }

  if (step === "done" && result) {
    return (
      <div className="card p-8 text-center">
        <span className="pill pill-green">Live on pump.fun</span>
        <h2 className="mt-4 text-2xl font-bold">${symbol.toUpperCase()} is live</h2>
        <p className="mt-2 text-muted">100% of its creator rewards go to the FansPad treasury.</p>
        <div className="mono mt-6 break-all rounded-xl bg-elev p-3 text-xs text-muted">{result.mint}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={`https://pump.fun/coin/${result.mint}`} target="_blank" rel="noreferrer" className="btn btn-primary">Open on pump.fun</a>
          <a href={`https://solscan.io/tx/${result.signature}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Creation tx</a>
        </div>
        <p className="mt-6 text-xs text-muted">
          {result.sweepSig ? (
            <>Your dev-buy tokens were sent to {short(publicKey?.toBase58() ?? "")}.</>
          ) : devBuyNum > 0 ? (
            <>Dev-buy tokens are being transferred to your wallet. If they do not arrive within a few minutes, contact support with the mint address.</>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="pb-32">
      {status && !status.launchEnabled && (
        <div className="mb-6 rounded-2xl border border-line bg-elev p-4 text-sm text-muted">
          Launching is not enabled on this server yet. The operator needs to set <span className="mono">TREASURY_SECRET_KEY</span>.
        </div>
      )}

      <div className="card p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Luna Coin" required />
          </div>
          <div>
            <label className="label" htmlFor="symbol">Ticker</label>
            <input id="symbol" className="input uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 10))} placeholder="LUNA" required />
          </div>
        </div>

        <div className="mt-5">
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What is this coin about?" />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="image">Image</label>
            <label htmlFor="image" className="flex h-32 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-elev text-sm text-muted transition hover:border-cyan">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-24 w-24 rounded-xl object-cover" />
              ) : (
                <span>Click to choose PNG / JPG / GIF</span>
              )}
            </label>
            <input id="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="label" htmlFor="devbuy">Dev buy (SOL)</label>
            <input id="devbuy" className="input num" inputMode="decimal" value={devBuy} onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.1" />
            <p className="mt-1.5 text-xs text-muted">Bought at creation and sent to your wallet right after. Max {status?.maxDevBuySol ?? 10} SOL.</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="label">Links (optional)</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" />
            <input className="input" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" />
            <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#e6f6fd] p-4 text-sm text-[#0a5f8a]">
          <div className="font-semibold">Creator rewards</div>
          <p className="mt-1">
            This coin is created on pump.fun by the FansPad treasury, so <strong>100% of its creator rewards</strong> go to{" "}
            <span className="mono">{short(TREASURY_ADDRESS, 6)}</span>. The launcher receives none. Rewards are claimed by the treasury every 2 minutes.
          </p>
        </div>
      </div>

      {error && <div className="mt-4 rounded-2xl bg-[#fde8ef] p-4 text-sm text-rose">{error}</div>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-12">
          <dl className="num flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <Row k="Dev buy" v={fmtSol(devBuyNum * 1e9)} />
            <Row k="Creation" v={fmtSol(networkLamports)} />
            {feeLamports > 0 && <Row k="Fee" v={fmtSol(feeLamports)} />}
            <Row k="You pay" v={fmtSol(total)} strong />
          </dl>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted sm:block">
              Paid to the treasury, which creates the coin. <Link href="/docs" className="underline">Details</Link>
            </span>
            <button type="submit" className="btn btn-primary h-12 px-7 text-base" disabled={!canSubmit && !!publicKey}>
              {!publicKey
                ? "Connect wallet"
                : step === "quoting"
                  ? "Preparing…"
                  : step === "paying"
                    ? "Confirm in wallet…"
                    : step === "launching"
                      ? "Creating on pump.fun…"
                      : "Pay & launch"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted">{k}</dt>
      <dd className={strong ? "font-bold" : ""}>{v}</dd>
    </div>
  );
}
