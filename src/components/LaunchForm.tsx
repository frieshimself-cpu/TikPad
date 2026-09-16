"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { fmtSol } from "@/lib/format";
import { normalizeHandle } from "@/lib/handle";
import { launchToken, randomAddress, type Token } from "@/lib/store";

const NETWORK_LAMPORTS = 0.03e9;

/** Downscale the chosen image so it fits comfortably in browser storage. */
function toThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function LaunchForm({ initialHandle = "" }: { initialHandle?: string }) {
  const { publicKey } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [handle, setHandle] = useState(initialHandle);
  const [devBuy, setDevBuy] = useState("0.1");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Token | null>(null);

  const cleanHandle = useMemo(() => normalizeHandle(handle), [handle]);
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  const devBuyNum = Number(devBuy) || 0;
  const canSubmit = name.trim().length > 0 && /^[A-Za-z0-9]{1,10}$/.test(symbol.trim()) && !!cleanHandle && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanHandle) return;
    setBusy(true);
    setError(null);
    try {
      const image_url = image ? await toThumb(image) : null;
      // Preview: the launch is recorded in your browser. The real flow (payment, IPFS, pump.fun) lives in /backend.
      await new Promise((r) => setTimeout(r, 900));
      const token = launchToken({
        name: name.trim(),
        symbol: symbol.trim(),
        description,
        handle: cleanHandle,
        devBuySol: devBuyNum,
        wallet: publicKey?.toBase58() ?? randomAddress(),
        image_url,
      });
      setResult(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="card p-8 text-center">
        <span className="pill pill-amber">Preview launch</span>
        <h2 className="mt-4 text-2xl font-semibold">${result.symbol} is live</h2>
        <p className="mt-2 text-muted">
          Creator fees now route to <span className="font-medium text-fg">@{result.recipient_handle}</span>.
        </p>
        <div className="num mt-6 break-all rounded-xl border border-line bg-elev p-3 text-xs text-muted">{result.mint}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/t/${result.mint}`} className="btn btn-primary">View token page</Link>
          <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={`https://www.tiktok.com/@${result.recipient_handle}`}>
            Tell @{result.recipient_handle}
          </a>
        </div>
        <p className="mt-6 text-xs text-dim">Preview mode: nothing was sent on chain.</p>
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
            <input id="handle" className="input pl-8" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="khaby.lame or a tiktok.com/@ link" required />
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
          <textarea id="description" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What is this token about?" />
          <p className="mt-1.5 text-xs text-dim">
            We append <span className="num text-muted">Fees to @{cleanHandle || "handle"} via TikPad</span> so the routing is visible on pump.fun.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="image">Image</label>
            <label htmlFor="image" className="flex h-28 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong bg-elev text-sm text-muted transition hover:border-dim">
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
            <input id="devbuy" className="input num" inputMode="decimal" value={devBuy} onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.1" />
            <p className="mt-1.5 text-xs text-dim">Tokens bought at launch are sent to your wallet right after creation.</p>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="card p-6">
          <h3 className="font-semibold">Summary</h3>
          <dl className="num mt-4 space-y-2 text-sm">
            <Row k="Dev buy" v={fmtSol(devBuyNum * 1e9)} />
            <Row k="Network + creation" v={fmtSol(NETWORK_LAMPORTS)} />
            <Row k="TikPad fee" v={fmtSol(0)} />
            <div className="border-t border-line pt-2">
              <Row k="You pay" v={fmtSol(devBuyNum * 1e9 + NETWORK_LAMPORTS)} strong />
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-dim">
            Payment goes to the TikPad treasury, which creates the token as its on-chain creator so every creator fee routes through it.
          </p>
        </div>

        {error && <div className="rounded-xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">{error}</div>}

        <button type="submit" className="btn btn-primary h-12 w-full text-base" disabled={!canSubmit}>
          {busy ? "Creating token…" : "Launch (preview)"}
        </button>
        <p className="text-center text-xs text-amber">Preview: no wallet or SOL needed, nothing is sent on chain.</p>
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
