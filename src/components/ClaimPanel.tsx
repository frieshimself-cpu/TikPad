"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Avatar } from "./Avatar";
import { TokenImage } from "./TokenImage";
import { fmtSol, fmtUsd, short, timeAgo } from "@/lib/format";
import type { Balance, LedgerRow, PayoutRow, TokenRow } from "@/lib/db";

interface Me {
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  payout_wallet: string | null;
  balance: Balance;
  next_milestone_cents: number;
  tokens: TokenRow[];
  credits: LedgerRow[];
  payouts: PayoutRow[];
}

export function ClaimPanel({ demoSignIn, initialError }: { demoSignIn: boolean; initialError?: string }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const { publicKey } = useWallet();

  const load = useCallback(async () => {
    const r = await fetch("/api/me", { cache: "no-store" });
    const j = (await r.json()) as { me: Me | null; demo: boolean };
    setMe(j.me);
    setDemo(j.demo);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ me: Me | null; demo: boolean }>)
      .then((j) => {
        if (!alive) return;
        setMe(j.me);
        setDemo(j.demo);
      })
      .catch(() => alive && setMe(null));
    return () => {
      alive = false;
    };
  }, []);

  async function demoLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle }) });
    const j = (await r.json()) as { error?: string };
    setBusy(false);
    if (!r.ok) return setError(j.error ?? "Sign-in failed");
    await load();
  }

  async function linkWallet(wallet: string | null) {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/me/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet }) });
    const j = (await r.json()) as { error?: string };
    setBusy(false);
    if (!r.ok) return setError(j.error ?? "Could not save wallet");
    await load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
  }

  if (me === undefined) return <div className="card h-40 animate-pulse" />;

  if (!me) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h2 className="text-xl font-semibold">Claim what tokens have earned you</h2>
        <p className="mt-2 text-sm text-muted">Sign in with TikTok to prove you own the handle. Then link a Solana wallet and TikPad pays you at each milestone.</p>
        {error && <div className="mt-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{error}</div>}
        {demoSignIn && demo ? (
          <form onSubmit={demoLogin} className="mt-6">
            <label className="label text-left" htmlFor="demo-handle">Demo sign-in: enter any handle</label>
            <div className="flex gap-2">
              <input id="demo-handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="khaby.lame" autoFocus />
              <button className="btn btn-primary" disabled={busy}>Continue</button>
            </div>
            <p className="mt-3 text-xs text-dim">TikTok Login Kit is not configured, so ownership is not verified here.</p>
          </form>
        ) : (
          <a href="/api/auth/tiktok" className="btn btn-accent mt-6 w-full">
            <TikTokMark /> Continue with TikTok
          </a>
        )}
      </div>
    );
  }

  const b = me.balance;
  const toGo = Math.max(0, me.next_milestone_cents - (b.paid_cents + b.unpaid_cents));
  const progress = Math.min(100, Math.round(((b.paid_cents + b.unpaid_cents) / me.next_milestone_cents) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <Avatar handle={me.handle} src={me.avatar_url} size={56} />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold">@{me.handle}</div>
              <div className="text-sm text-muted">{me.display_name}</div>
            </div>
            <Link href={`/c/${me.handle}`} className="text-sm text-muted hover:text-fg">Public page →</Link>
            <button onClick={logout} className="text-sm text-dim hover:text-fg">Sign out</button>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            <Metric k="Unpaid" v={fmtUsd(b.unpaid_cents)} s={fmtSol(b.unpaid_lamports)} accent />
            <Metric k="Paid out" v={fmtUsd(b.paid_cents)} s={fmtSol(b.paid_lamports)} />
            <Metric k="Lifetime" v={fmtUsd(b.earned_cents)} s={fmtSol(b.earned_lamports)} />
          </dl>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted">
              <span>Next payout at {fmtUsd(me.next_milestone_cents)} lifetime</span>
              <span className="num">{toGo === 0 ? "ready" : `${fmtUsd(toGo)} to go`}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-elev">
              <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-dim">
              {me.payout_wallet
                ? "Payouts are sent automatically by the fee router once a milestone is crossed."
                : "Link a wallet to receive payouts. Your balance keeps accruing either way."}
            </p>
          </div>
        </div>

        <section className="card">
          <h3 className="border-b border-line px-5 py-3 text-sm font-medium">Tokens routing to you</h3>
          {me.tokens.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-dim">
              No tokens yet. <Link href="/launch" className="underline">Launch one</Link> or ask your community to.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {me.tokens.map((t) => (
                <li key={t.mint} className="flex items-center gap-3 px-5 py-3">
                  <TokenImage src={t.image_url} symbol={t.symbol} size={36} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/t/${t.mint}`} className="font-medium hover:underline">{t.name}</Link>
                    <div className="num text-xs text-dim">${t.symbol} · {short(t.mint)}</div>
                  </div>
                  <span className="num text-xs text-dim">{timeAgo(t.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3 className="border-b border-line px-5 py-3 text-sm font-medium">Payouts</h3>
          {me.payouts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-dim">No payouts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {me.payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="num">{fmtUsd(p.usd_cents)} <span className="text-dim">· {fmtSol(p.lamports)}</span></div>
                    <div className="num text-xs text-dim">to {short(p.wallet)} · {timeAgo(p.ts)}</div>
                  </div>
                  {p.demo ? <span className="pill pill-amber">demo</span> : (
                    <a className="num text-xs text-cyan hover:underline" href={`https://solscan.io/tx/${p.sig}`} target="_blank" rel="noreferrer">{short(p.sig, 6)} ↗</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3 className="border-b border-line px-5 py-3 text-sm font-medium">Fee credits</h3>
          {me.credits.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-dim">Fees show up here after each claim from pump.fun.</p>
          ) : (
            <ul className="divide-y divide-line">
              {me.credits.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="num text-xs text-dim">{c.mint ? <Link href={`/t/${c.mint}`} className="hover:text-fg">{short(c.mint)}</Link> : "—"} · {timeAgo(c.ts)}</div>
                  <div className="num">{fmtUsd(c.usd_cents)} <span className="text-dim">· {fmtSol(c.lamports)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="card p-6">
          <h3 className="font-semibold">Payout wallet</h3>
          {me.payout_wallet ? (
            <>
              <div className="num mt-3 break-all rounded-xl border border-line bg-elev p-3 text-xs">{me.payout_wallet}</div>
              <button className="btn btn-ghost mt-3 w-full" onClick={() => linkWallet(null)} disabled={busy}>Unlink</button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">Where should we send your SOL?</p>
              {publicKey ? (
                <button className="btn btn-primary mt-4 w-full" onClick={() => linkWallet(publicKey.toBase58())} disabled={busy}>
                  Use {short(publicKey.toBase58())}
                </button>
              ) : (
                <p className="mt-4 text-xs text-dim">Connect a wallet in the top bar, or paste an address below.</p>
              )}
              <ManualWallet onSave={linkWallet} busy={busy} />
            </>
          )}
          {error && <div className="mt-3 rounded-xl border border-rose/40 bg-rose/10 p-3 text-xs text-rose">{error}</div>}
        </div>
        <div className="card p-6 text-sm text-muted">
          <h3 className="font-semibold text-fg">How payouts work</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
            <li>Every pump.fun creator-fee claim is split: 80% to you, 20% to TikPad.</li>
            <li>Your share is paid when lifetime earnings cross $5, $10, $20, $50, $100, $250, $500, $1,000, then every $1,000.</li>
            <li>Payouts are in SOL, sent on Solana to the wallet above.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ManualWallet({ onSave, busy }: { onSave: (w: string) => void; busy: boolean }) {
  const [v, setV] = useState("");
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSave(v.trim());
      }}
    >
      <input className="input num text-xs" value={v} onChange={(e) => setV(e.target.value)} placeholder="Solana address" />
      <button className="btn btn-ghost" disabled={busy || !v.trim()}>Save</button>
    </form>
  );
}

function Metric({ k, v, s, accent }: { k: string; v: string; s: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-elev p-3">
      <div className="text-xs text-dim">{k}</div>
      <div className={`num mt-1 text-lg font-semibold ${accent ? "text-cyan" : ""}`}>{v}</div>
      <div className="num text-xs text-dim">{s}</div>
    </div>
  );
}

function TikTokMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.5 2h3.1c.2 2 1.5 3.6 3.6 3.8v3.1c-1.4 0-2.6-.4-3.6-1.1v6.2A5.4 5.4 0 1 1 10.2 8.6h.6v3.2h-.6a2.2 2.2 0 1 0 2.3 2.2V2Z" />
    </svg>
  );
}
