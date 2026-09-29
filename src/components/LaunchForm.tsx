"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Buffer } from "buffer";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { fmtSol, short } from "@/lib/format";
import { TREASURY_ADDRESS } from "@/lib/economics";
import { normalizeHandle } from "@/lib/handle";
import { recordLaunch } from "@/lib/store";

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
  const [handle, setHandle] = useState("");
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
  const cleanHandle = useMemo(() => normalizeHandle(handle), [handle]);
  const devBuyNum = Number(devBuy) || 0;
  const networkLamports = status?.networkLamports ?? 0.03e9;
  const feeLamports = status?.feeLamports ?? 0;
  const total = devBuyNum * 1e9 + networkLamports + feeLamports;
  const enabled = status?.launchEnabled ?? false;
  const busy = step !== "form";
  const canSubmit = enabled && !busy && (!handle.trim() || !!cleanHandle) && name.trim().length > 0 && /^[A-Za-z0-9]{1,10}$/.test(symbol.trim()) && !!image && devBuyNum <= (status?.maxDevBuySol ?? 10);

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
      if (cleanHandle) fd.set("handle", cleanHandle);
      fd.set("wallet", publicKey.toBase58());
      if (twitter.trim()) fd.set("twitter", twitter.trim());
      if (telegram.trim()) fd.set("telegram", telegram.trim());
      if (website.trim()) fd.set("website", website.trim());
      fd.set("image", image!);
      const lr = await fetch("/api/launch", { method: "POST", body: fd });
      const res = (await lr.json()) as Result & { error?: string };
      if (!lr.ok) throw new Error(res.error ?? "Launch failed.");
      recordLaunch({ mint: res.mint, name: name.trim(), symbol: symbol.trim(), description: description.trim(), x_handle: cleanHandle, wallet: publicKey.toBase58(), image_url: res.imageUrl, devBuySol: devBuyNum });
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
        <p className="mt-2 text-muted">From its first trade, creator rewards fund its ad budget{cleanHandle ? <>, promoting <span className="font-semibold text-fg">@{cleanHandle}</span></> : null}.</p>
        <div className="mono mt-6 break-all rounded-xl bg-elev p-3 text-xs text-muted">{result.mint}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/t/${result.mint}`} className="btn btn-primary">View campaign page</Link>
          <a href={`https://pump.fun/coin/${result.mint}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Open on pump.fun</a>
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
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
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
          <label className="label" htmlFor="handle">Coin&apos;s X account (optional)</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
            <input id="handle" className="input pl-9" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle or x.com/handle" />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {handle && !cleanHandle ? <span className="text-rose">X handles are 1–15 letters, numbers or underscores.</span> : <>Campaigns promote this account. The description gets the tag <span className="mono">Creator fees fund this coin&apos;s ads via AdPad</span>.</>}
          </p>
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

        <div className="mt-6 rounded-2xl bg-elev p-4 text-sm text-muted">
          <div className="font-semibold text-fg">Creator rewards → ad budget</div>
          <p className="mt-1">
            This coin is created on pump.fun by the AdPad treasury, so <strong className="text-fg">100% of its creator rewards</strong> go to{" "}
            <span className="mono">{short(TREASURY_ADDRESS, 6)}</span>. 90% funds this coin&apos;s advertising, 10% covers AdPad. The launcher receives
            no creator rewards. Claimed every 2 minutes.
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <h3 className="font-bold">Summary</h3>
          <dl className="num mt-4 space-y-2 text-sm">
            <Row k="Dev buy" v={fmtSol(devBuyNum * 1e9)} />
            <Row k="Creation reserve" v={fmtSol(networkLamports)} />
            {feeLamports > 0 && <Row k="Fee" v={fmtSol(feeLamports)} />}
            <div className="border-t border-line pt-2">
              <Row k="You pay" v={fmtSol(total)} strong />
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Paid to the AdPad treasury, which creates the coin as its on-chain creator. <Link href="/docs" className="underline">Details</Link>
          </p>
          {error && <div className="mt-4 rounded-xl bg-[#2a1420] p-3 text-sm text-rose">{error}</div>}
          <button type="submit" className="btn btn-primary mt-5 h-12 w-full text-base" disabled={!canSubmit && !!publicKey}>
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
      </aside>
    </form>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{k}</dt>
      <dd className={strong ? "font-bold" : ""}>{v}</dd>
    </div>
  );
}
