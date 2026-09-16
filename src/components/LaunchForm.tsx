"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Buffer } from "buffer";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { fmtSol } from "@/lib/format";
import { normalizeHandle } from "@/lib/tiktok";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

interface Quote {
  id: string;
  treasury: string;
  dev_buy_lamports: number;
  network_lamports: number;
  fee_lamports: number;
  total_lamports: number;
  demo: boolean;
}

type Step = "form" | "paying" | "launching" | "done";

export function LaunchForm({ demo, initialHandle = "" }: { demo: boolean; initialHandle?: string }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [handle, setHandle] = useState(initialHandle);
  const [devBuy, setDevBuy] = useState("0.1");
  const [image, setImage] = useState<File | null>(null);
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ mint: string; signature: string | null; demo: boolean } | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const cleanHandle = useMemo(() => normalizeHandle(handle), [handle]);
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  const devBuyNum = Number(devBuy) || 0;

  const canSubmit =
    name.trim().length > 0 && /^[A-Za-z0-9]{1,10}$/.test(symbol.trim()) && !!cleanHandle && (demo || !!image) && step === "form";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // In demo mode a wallet is optional so the flow can be explored without an extension.
    const wallet = publicKey?.toBase58() ?? (demo ? PublicKey.default.toBase58() : null);
    if (!wallet) {
      setVisible(true);
      return;
    }
    if (!cleanHandle) return;
    try {
      // 1. Quote
      const qr = await fetch("/api/launch/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, handle: cleanHandle, devBuySol: devBuyNum }),
      });
      const q = (await qr.json()) as Quote & { error?: string };
      if (!qr.ok) throw new Error(q.error ?? "Could not get a quote.");
      setQuote(q);

      // 2. Pay the treasury (skipped in demo mode)
      let paymentSig: string | null = null;
      if (!q.demo) {
        if (!publicKey) throw new Error("Connect a wallet to pay for the launch.");
        setStep("paying");
        const tx = new Transaction().add(
          SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(q.treasury), lamports: q.total_lamports }),
          new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(q.id, "utf8") }),
        );
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;
        paymentSig = await sendTransaction(tx, connection);
        await connection.confirmTransaction({ signature: paymentSig, blockhash, lastValidBlockHeight }, "confirmed");
      }

      // 3. Launch
      setStep("launching");
      const fd = new FormData();
      fd.set("quoteId", q.id);
      if (paymentSig) fd.set("paymentSig", paymentSig);
      fd.set("name", name.trim());
      fd.set("symbol", symbol.trim().toUpperCase());
      fd.set("description", description.trim());
      fd.set("handle", cleanHandle);
      fd.set("devBuySol", String(devBuyNum));
      fd.set("wallet", wallet);
      if (twitter.trim()) fd.set("twitter", twitter.trim());
      if (website.trim()) fd.set("website", website.trim());
      if (image) fd.set("image", image);
      const lr = await fetch("/api/launch", { method: "POST", body: fd });
      const res = (await lr.json()) as { mint: string; signature: string | null; demo: boolean; error?: string };
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
        <span className={`pill ${result.demo ? "pill-amber" : "pill-green"}`}>{result.demo ? "Simulated launch" : "Live on pump.fun"}</span>
        <h2 className="mt-4 text-2xl font-semibold">${symbol.toUpperCase()} is live</h2>
        <p className="mt-2 text-muted">
          Creator fees now route to <span className="font-medium text-fg">@{cleanHandle}</span>.
        </p>
        <div className="num mt-6 break-all rounded-xl border border-line bg-elev p-3 text-xs text-muted">{result.mint}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/t/${result.mint}`} className="btn btn-primary">
            View token page
          </Link>
          {!result.demo && (
            <a href={`https://pump.fun/coin/${result.mint}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Open on pump.fun
            </a>
          )}
          <a
            className="btn btn-ghost"
            target="_blank"
            rel="noreferrer"
            href={`https://www.tiktok.com/@${cleanHandle}`}
          >
            Tell @{cleanHandle}
          </a>
        </div>
        {result.demo && (
          <p className="mt-6 text-xs text-dim">
            Demo mode: nothing was sent on chain. Set TREASURY_SECRET_KEY and PINATA_JWT to launch for real.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="card p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Khaby Coin" required />
          </div>
          <div>
            <label className="label" htmlFor="symbol">Ticker</label>
            <input
              id="symbol"
              className="input num uppercase"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 10))}
              placeholder="KHABY"
              required
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="label" htmlFor="handle">TikTok handle that gets paid</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">@</span>
            <input
              id="handle"
              className="input pl-8"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="khaby.lame or a tiktok.com/@ link"
              required
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className={handle && !cleanHandle ? "text-rose" : "text-dim"}>
              {handle && !cleanHandle ? "Handles are 2–24 letters, numbers, dots or underscores." : "The creator does not need to do anything first."}
            </span>
            {cleanHandle && (
              <a className="text-cyan hover:underline" href={`https://www.tiktok.com/@${cleanHandle}`} target="_blank" rel="noreferrer">
                tiktok.com/@{cleanHandle} ↗
              </a>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="What is this token about?"
          />
          <p className="mt-1.5 text-xs text-dim">
            We append <span className="num text-muted">Fees to @{cleanHandle || "handle"} via TikPad</span> so the routing is visible on pump.fun.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="image">Image {demo ? "(optional in demo)" : ""}</label>
            <label
              htmlFor="image"
              className="flex h-28 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong bg-elev text-sm text-muted transition hover:border-dim"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <span>Click to choose PNG / JPG / GIF</span>
              )}
            </label>
            <input id="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="label" htmlFor="devbuy">Dev buy (SOL)</label>
            <input
              id="devbuy"
              className="input num"
              inputMode="decimal"
              value={devBuy}
              onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.1"
            />
            <p className="mt-1.5 text-xs text-dim">Tokens bought at launch are sent to your wallet right after creation.</p>
          </div>
        </div>

        <details className="mt-5">
          <summary className="cursor-pointer text-sm text-muted hover:text-fg">Socials (optional)</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <input className="input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" />
            <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
        </details>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="card p-6">
          <h3 className="font-semibold">Summary</h3>
          <dl className="num mt-4 space-y-2 text-sm">
            <Row k="Dev buy" v={fmtSol(devBuyNum * 1e9)} />
            <Row k="Network + creation" v={fmtSol(quote?.network_lamports ?? 0.03e9)} />
            <Row k="TikPad fee" v={fmtSol(quote?.fee_lamports ?? 0)} />
            <div className="border-t border-line pt-2">
              <Row k="You pay" v={fmtSol(devBuyNum * 1e9 + (quote?.network_lamports ?? 0.03e9) + (quote?.fee_lamports ?? 0))} strong />
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-dim">
            Payment goes to the TikPad treasury, which creates the token as its on-chain creator so every creator fee routes through it. Unused
            network reserve stays in the treasury.
          </p>
        </div>

        {error && <div className="rounded-xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">{error}</div>}

        <button type="submit" className="btn btn-primary h-12 w-full text-base" disabled={!canSubmit && (!!publicKey || demo)}>
          {!publicKey && !demo
            ? "Connect wallet to launch"
            : step === "paying"
              ? "Confirm in wallet…"
              : step === "launching"
                ? "Creating token…"
                : demo
                  ? "Simulate launch"
                  : "Pay & launch"}
        </button>
        {demo && !publicKey && <p className="text-center text-xs text-amber">Demo mode: no wallet needed, nothing is sent on chain.</p>}
        <p className="text-center text-xs text-dim">
          80% of creator fees go to @{cleanHandle || "handle"}, 20% to TikPad. <Link href="/docs" className="underline">Details</Link>
        </p>
      </aside>
    </form>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className={strong ? "font-semibold" : ""}>{v}</dd>
    </div>
  );
}
