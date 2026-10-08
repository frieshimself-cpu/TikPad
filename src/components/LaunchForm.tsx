"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { VerdictCard } from "./VerdictCard";
import { fmtSol, short } from "@/lib/format";
import { BRAND, IMAGE_TYPES, MAX_IMAGE_BYTES, pumpUrl } from "@/lib/brand";
import { DETECTOR_LABEL, type DetectorName, type ImageVerdict } from "@/lib/verdict";

interface Status {
  launchEnabled: boolean;
  detectors: DetectorName[];
  threshold: number;
  maxDevBuySol: number;
  priorityFeeSol: number;
}
interface Prepared {
  tx: string;
  mint: string;
  imageUrl: string | null;
  metadataUri: string;
  verdict: ImageVerdict;
  launchToken: string;
}
type Check = { state: "idle" } | { state: "checking" } | { state: "done"; verdict: ImageVerdict; token: string } | { state: "error"; message: string };
type Step = "form" | "preparing" | "signing" | "confirming" | "done";

/** pump.fun creation rent + PumpPortal's fee, roughly. Shown as an estimate only. */
const CREATION_LAMPORTS = 0.02e9;

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
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ mint: string; signature: string; imageUrl: string | null } | null>(null);
  const checkId = useRef(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => r.json() as Promise<Status>)
      .then((s) => alive && setStatus(s))
      .catch(() => alive && setStatus({ launchEnabled: false, detectors: ["provenance"], threshold: 0.5, maxDevBuySol: 10, priorityFeeSol: 0.0005 }));
    return () => {
      alive = false;
    };
  }, []);

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const devBuyNum = Number(devBuy) || 0;
  const enabled = status?.launchEnabled ?? false;
  const busy = step !== "form";
  const passed = check.state === "done" && check.verdict.allowed;
  const canSubmit = enabled && !busy && passed && name.trim().length > 0 && /^[A-Za-z0-9]{1,10}$/.test(symbol.trim()) && !!image && devBuyNum <= (status?.maxDevBuySol ?? 10);

  async function pickImage(file: File | null) {
    setImage(file);
    setError(null);
    const id = ++checkId.current;
    if (!file) {
      setCheck({ state: "idle" });
      return;
    }
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setCheck({ state: "error", message: "Use a PNG, JPEG, GIF or WebP file." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setCheck({ state: "error", message: `Image must be under ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.` });
      return;
    }
    setCheck({ state: "checking" });
    try {
      const fd = new FormData();
      fd.set("image", file);
      const r = await fetch("/api/image-check", { method: "POST", body: fd });
      const j = (await r.json()) as { verdict?: ImageVerdict; token?: string; error?: string };
      if (id !== checkId.current) return; // a newer image was picked meanwhile
      if (!r.ok || !j.verdict || !j.token) throw new Error(j.error ?? "Could not check the image.");
      setCheck({ state: "done", verdict: j.verdict, token: j.token });
    } catch (e) {
      if (id !== checkId.current) return;
      setCheck({ state: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!publicKey) return;
    if (!image || check.state !== "done") return;
    try {
      // 1. Server: gate + metadata + unsigned create transaction for this wallet.
      setStep("preparing");
      const mintKp = Keypair.generate();
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("symbol", symbol.trim().toUpperCase());
      fd.set("description", description.trim());
      fd.set("wallet", publicKey.toBase58());
      fd.set("mint", mintKp.publicKey.toBase58());
      fd.set("devBuySol", String(devBuyNum));
      fd.set("verdictToken", check.token);
      if (twitter.trim()) fd.set("twitter", twitter.trim());
      if (telegram.trim()) fd.set("telegram", telegram.trim());
      if (website.trim()) fd.set("website", website.trim());
      fd.set("image", image);
      const pr = await fetch("/api/launch/prepare", { method: "POST", body: fd });
      const prep = (await pr.json()) as Prepared & { error?: string; verdict?: ImageVerdict };
      if (pr.status === 422 && prep.verdict) {
        setCheck({ state: "done", verdict: prep.verdict, token: "" });
        throw new Error(prep.error ?? "The image was rejected.");
      }
      if (!pr.ok) throw new Error(prep.error ?? "Could not prepare the launch.");

      // 2. Wallet: sign (mint keypair co-signs) and send.
      setStep("signing");
      const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(prep.tx), (c) => c.charCodeAt(0)));
      const signature = await sendTransaction(tx, connection, { signers: [mintKp], skipPreflight: false, maxRetries: 3 });
      setStep("confirming");
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...latest }, "confirmed");

      // 3. Server: verify on chain and list it (best effort; the coin exists either way).
      fetch("/api/launch/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ launchToken: prep.launchToken, signature }) }).catch(() => {});
      setResult({ mint: prep.mint, signature, imageUrl: prep.imageUrl });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("form");
    }
  }

  if (step === "done" && result) {
    return (
      <div className="card p-8 text-center">
        <span className="stamp stamp-green">human-made</span>
        <h2 className="mt-5 text-4xl">${symbol.toUpperCase()} is live on pump.fun!!</h2>
        <p className="mt-2 text-lg text-muted">made by {short(publicKey?.toBase58() ?? "")}. you&apos;re the creator and keep every creator reward.</p>
        <div className="mono wobbly-2 mt-6 break-all border-[2px] border-dashed border-line bg-elev p-3 text-xs text-muted">{result.mint}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={pumpUrl(result.mint)} target="_blank" rel="noreferrer" className="btn btn-primary">open on pump.fun</a>
          <a href={`https://solscan.io/tx/${result.signature}`} target="_blank" rel="noreferrer" className="btn btn-ghost">creation tx</a>
          <Link href={`/t/${result.mint}`} className="btn btn-ghost">coin page</Link>
        </div>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="pill pill-ink rotate-[-2deg]">wallet needed</span>
        <h2 className="mt-5 text-4xl">connect a wallet to launch</h2>
        <p className="mx-auto mt-3 max-w-md text-lg text-muted">
          coins get made from your own wallet. it pays for the launch, signs the transaction, and becomes the coin&apos;s creator on pump.fun.
          {BRAND} never touches your keys or your money.
        </p>
        <button type="button" onClick={() => setVisible(true)} className="btn btn-primary mt-8 h-13 px-8 text-lg">connect wallet</button>
        <p className="mt-4 text-sm text-dim">phantom and solflare work.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="pb-32">
      {status && !status.launchEnabled && (
        <div className="card mb-8 bg-amber-soft p-4 text-amber">
          launching is paused on this server: no AI-image detector is set up. the operator needs to set <span className="mono">ANTHROPIC_API_KEY</span> (or Sightengine keys).
        </div>
      )}

      <div className="card p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div>
            <label className="label" htmlFor="image">picture</label>
            <label
              htmlFor="image"
              className={`wobbly-2 relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden border-[3px] border-dashed bg-elev text-center text-muted transition hover:bg-white ${
                check.state === "checking" ? "scan border-blue" : check.state === "done" ? (check.verdict.allowed ? "border-green" : "border-rose") : "border-line"
              }`}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="px-6">
                  click to pick a PNG, JPG, GIF or WebP
                  <br />
                  <span className="text-sm text-dim">must be made by a human!!</span>
                </span>
              )}
              {check.state === "done" && (
                <span className={`stamp absolute right-3 top-3 ${check.verdict.allowed ? "stamp-green" : "stamp-rose"}`}>{check.verdict.allowed ? "human-made" : "AI!!"}</span>
              )}
            </label>
            <input id="image" type="file" accept={IMAGE_TYPES.join(",")} className="hidden" disabled={busy} onChange={(e) => pickImage(e.target.files?.[0] ?? null)} />
            <p className="mt-2 text-xs text-muted">
              {check.state === "checking" ? "looking at it…" : check.state === "idle" ? "we check the picture the moment you pick it." : null}
            </p>
          </div>

          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="paint cat" required disabled={busy} />
              </div>
              <div>
                <label className="label" htmlFor="symbol">ticker</label>
                <input id="symbol" className="input uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 10))} placeholder="PAINT" required disabled={busy} />
              </div>
            </div>
            <div className="mt-5">
              <label className="label" htmlFor="description">description</label>
              <textarea id="description" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="what is this coin about?" disabled={busy} />
            </div>
            <div className="mt-5">
              <label className="label" htmlFor="devbuy">dev buy (SOL)</label>
              <input id="devbuy" className="input num" inputMode="decimal" value={devBuy} onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.1" disabled={busy} />
              <p className="mt-1.5 text-sm text-muted">bought in the creation transaction, lands in your wallet. 0 is fine. max {status?.maxDevBuySol ?? 10} SOL.</p>
            </div>
            <div className="mt-5">
              <div className="label">links (optional)</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" disabled={busy} />
                <input className="input" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" disabled={busy} />
                <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" disabled={busy} />
              </div>
            </div>
          </div>
        </div>

        {check.state === "done" && <div className="mt-6"><VerdictCard verdict={check.verdict} /></div>}
        {check.state === "error" && <div className="card mt-6 bg-rose-soft p-4 text-rose">{check.message}</div>}

        <div className="card card-yellow mt-8 p-5 text-muted">
          <div className="font-display text-lg text-fg">what happens</div>
          <p className="mt-1">
            {BRAND} checks the picture with {status ? status.detectors.map((d) => DETECTOR_LABEL[d]).join(", ") : "its detectors"}. if it passes, the metadata gets uploaded and you sign one pump.fun
            creation transaction from your own wallet. your wallet is the coin&apos;s creator. {BRAND} never holds your money or your coin.
          </p>
        </div>
      </div>

      {error && <div className="card mt-6 bg-rose-soft p-4 text-rose">{error}</div>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <dl className="num flex flex-wrap gap-x-8 gap-y-1">
            <Row k="dev buy" v={fmtSol(devBuyNum * 1e9)} />
            <Row k="creation (est.)" v={fmtSol(CREATION_LAMPORTS + (status?.priorityFeeSol ?? 0.0005) * 1e9)} />
            <Row k="picture" v={check.state === "done" ? (check.verdict.allowed ? "passed ✓" : "blocked ✗") : check.state === "checking" ? "checking…" : "—"} strong />
          </dl>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:block">
              signed by {short(publicKey.toBase58())}. <Link href="/docs" className="underline">details</Link>
            </span>
            <button type="submit" className="btn btn-primary h-13 px-7 text-lg" disabled={!canSubmit}>
              {step === "preparing"
                  ? "checking & preparing…"
                  : step === "signing"
                    ? "confirm in wallet…"
                    : step === "confirming"
                      ? "confirming on chain…"
                      : check.state === "done" && !check.verdict.allowed
                        ? "picture rejected"
                        : "deploy on pump.fun"}
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
      <dd className={strong ? "font-display" : ""}>{v}</dd>
    </div>
  );
}
