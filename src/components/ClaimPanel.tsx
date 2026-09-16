"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Avatar } from "./Avatar";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { fmtSol, fmtUsd, short, timeAgo } from "@/lib/format";
import { normalizeHandle } from "@/lib/handle";
import { balanceFor, creditsFor, linkWallet, me, nextMilestoneCents, payoutsFor, signIn, signOut, tokensFor, useStore } from "@/lib/store";

export function ClaimPanel() {
  const state = useStore();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useWallet();

  if (!state) return <Skeleton className="h-64" />;
  const user = me(state);

  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h2 className="text-xl font-semibold">Claim what tokens have earned you</h2>
        <p className="mt-2 text-sm text-muted">Sign in with TikTok to prove you own the handle. Then link a Solana wallet and TikPad pays you at each milestone.</p>
        <button className="btn btn-accent mt-6 w-full" onClick={() => setError("TikTok sign-in is not connected in this preview. Use the handle box below.")}>
          <TikTokMark /> Continue with TikTok
        </button>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            const h = normalizeHandle(handle);
            if (!h) return setError("Enter a valid TikTok handle.");
            setError(null);
            signIn(h);
          }}
        >
          <label className="label text-left" htmlFor="demo-handle">Preview sign-in: enter any handle</label>
          <div className="flex gap-2">
            <input id="demo-handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="khaby.lame" />
            <button className="btn btn-primary">Continue</button>
          </div>
        </form>
        {error && <div className="mt-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{error}</div>}
      </div>
    );
  }

  const b = balanceFor(state, user.handle);
  const tokens = tokensFor(state, user.handle);
  const payouts = payoutsFor(state, user.handle);
  const credits = creditsFor(state, user.handle).slice(0, 30);
  const milestone = nextMilestoneCents(b.paid_cents);
  const toGo = Math.max(0, milestone - (b.paid_cents + b.unpaid_cents));
  const progress = Math.min(100, Math.round(((b.paid_cents + b.unpaid_cents) / milestone) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="order-2 space-y-6 lg:order-2">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <Avatar handle={user.handle} src={user.avatar_url} size={56} />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold">@{user.handle}</div>
              <div className="text-sm text-muted">{user.display_name}</div>
            </div>
            <Link href={`/c/${user.handle}`} className="text-sm text-muted hover:text-fg">Public page →</Link>
            <button onClick={signOut} className="text-sm text-dim hover:text-fg">Sign out</button>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            <Metric k="Unpaid" v={fmtUsd(b.unpaid_cents)} s={fmtSol(b.unpaid_lamports)} accent />
            <Metric k="Paid out" v={fmtUsd(b.paid_cents)} s={fmtSol(b.paid_lamports)} />
            <Metric k="Lifetime" v={fmtUsd(b.earned_cents)} s={fmtSol(b.earned_lamports)} />
          </dl>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted">
              <span>Next payout at {fmtUsd(milestone)} lifetime</span>
              <span className="num">{toGo === 0 ? "ready" : `${fmtUsd(toGo)} to go`}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-elev">
              <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-dim">
              {user.payout_wallet ? "Payouts are sent automatically once a milestone is crossed." : "Link a wallet to receive payouts. Your balance keeps accruing either way."}
            </p>
          </div>
        </div>

        <Section title="Tokens routing to you" empty={tokens.length === 0 ? <>No tokens yet. <Link href="/launch" className="underline">Launch one</Link>.</> : null}>
          {tokens.map((t) => (
            <li key={t.mint} className="flex items-center gap-3 px-5 py-3">
              <TokenImage src={t.image_url} symbol={t.symbol} size={36} />
              <div className="min-w-0 flex-1">
                <Link href={`/t/${t.mint}`} className="font-medium hover:underline">{t.name}</Link>
                <div className="num text-xs text-dim">${t.symbol} · {short(t.mint)}</div>
              </div>
              <span className="num text-xs text-dim">{timeAgo(t.created_at)}</span>
            </li>
          ))}
        </Section>

        <Section title="Payouts" empty={payouts.length === 0 ? "No payouts yet." : null}>
          {payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="num">{fmtUsd(p.usd_cents)} <span className="text-dim">· {fmtSol(p.lamports)}</span></div>
                <div className="num text-xs text-dim">to {short(p.wallet)} · {timeAgo(p.ts)}</div>
              </div>
              <span className="pill pill-amber">preview</span>
            </li>
          ))}
        </Section>

        <Section title="Fee credits" empty={credits.length === 0 ? "Fees show up here after each claim from pump.fun." : null}>
          {credits.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="num text-xs text-dim">
                <Link href={`/t/${c.mint}`} className="hover:text-fg">{short(c.mint)}</Link> · {timeAgo(c.ts)}
              </div>
              <div className="num">{fmtUsd(c.usd_cents)} <span className="text-dim">· {fmtSol(c.lamports)}</span></div>
            </li>
          ))}
        </Section>
      </div>

      <aside className="order-1 space-y-4 lg:order-1">
        <div className="card p-6">
          <h3 className="font-semibold">Payout wallet</h3>
          {user.payout_wallet ? (
            <>
              <div className="num mt-3 break-all rounded-xl border border-line bg-elev p-3 text-xs">{user.payout_wallet}</div>
              <button className="btn btn-ghost mt-3 w-full" onClick={() => linkWallet(null)}>Unlink</button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">Where should we send your SOL?</p>
              {publicKey ? (
                <button className="btn btn-primary mt-4 w-full" onClick={() => linkWallet(publicKey.toBase58())}>Use {short(publicKey.toBase58())}</button>
              ) : (
                <p className="mt-4 text-xs text-dim">Connect a wallet in the top bar, or paste an address below.</p>
              )}
              <ManualWallet onSave={(w) => linkWallet(w)} />
            </>
          )}
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

function Section({ title, empty, children }: { title: string; empty: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3 className="border-b border-line px-5 py-3 text-sm font-medium">{title}</h3>
      {empty ? <p className="px-5 py-8 text-center text-sm text-dim">{empty}</p> : <ul className="divide-y divide-line">{children}</ul>}
    </section>
  );
}

function ManualWallet({ onSave }: { onSave: (w: string) => void }) {
  const [v, setV] = useState("");
  const valid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v.trim());
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(v.trim());
      }}
    >
      <input className="input num text-xs" value={v} onChange={(e) => setV(e.target.value)} placeholder="Solana address" />
      <button className="btn btn-ghost" disabled={!valid}>Save</button>
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
