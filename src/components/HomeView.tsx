"use client";

import Link from "next/link";
import { LiveFeed } from "./LiveFeed";
import { Stat } from "./Stat";
import { Avatar } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { ContractAddress } from "./ContractAddress";
import { fmtUsd } from "@/lib/format";
import { leaderboard, stats, useStore } from "@/lib/store";

export function HomeView() {
  const state = useStore();
  const st = state ? stats(state) : null;
  const top = state ? leaderboard(state, 6) : [];

  return (
    <div className="glow">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="pill pill-cyan mb-6">pump.fun · Solana · TikTok</span>
            <h1 className="text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Route token fees to <span className="bg-[#d9f99d] px-2">TikTok</span> creators.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Launch a token, point its creator fees at any TikTok handle, and TikPad pays the creator out automatically. No account needed on
              their side until they want to collect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-primary">Launch a token</Link>
              <Link href="/docs" className="btn btn-ghost">Read the docs</Link>
            </div>
            <div className="mt-8">
              <ContractAddress />
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Paid out" value={st ? fmtUsd(st.paid_cents) : "—"} />
              <Stat label="Earned" value={st ? fmtUsd(st.earned_cents) : "—"} />
              <Stat label="Tokens" value={st ? String(st.tokens) : "—"} />
              <Stat label="Creators" value={st ? String(st.creators) : "—"} />
            </dl>
          </div>
          {state ? <LiveFeed state={state} compact /> : <Skeleton className="h-[520px]" />}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Launch", "Fill in a name, ticker and image, and pick the TikTok @handle that should get paid. TikPad creates the token on pump.fun with its treasury as the on-chain creator."],
            ["02", "Fees accrue", "Every trade on pump.fun pays a creator fee. Because the treasury is the creator, those fees land with TikPad and are attributed to the token that produced them."],
            ["03", "Creator gets paid", "80% of every claim is credited to the TikTok handle. When the balance crosses $5, then $10, $20, $50 and so on, it is sent to the wallet the creator linked by signing in with TikTok."],
          ].map(([n, t, d]) => (
            <div key={n} className="card p-6">
              <div className="num text-xs text-dim">{n}</div>
              <div className="mt-2 text-lg font-semibold">{t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {top.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Top creators</h2>
            <Link href="/claim" className="text-sm text-muted hover:text-fg">Are you a creator? Claim →</Link>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((c, i) => (
              <li key={c.handle}>
                <Link href={`/c/${c.handle}`} className="card flex items-center gap-3 p-4 transition hover:border-line-strong">
                  <span className="num w-5 text-sm text-dim">{i + 1}</span>
                  <Avatar handle={c.handle} src={c.avatar_url} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">@{c.handle}</div>
                    <div className="text-xs text-muted">
                      {c.token_count} token{c.token_count === 1 ? "" : "s"} · {c.linked ? "wallet linked" : "unclaimed"}
                    </div>
                  </div>
                  <div className="num text-right text-sm font-medium">{fmtUsd(c.earned_cents)}</div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Is a token paying you?</h3>
            <p className="mt-1 text-sm text-muted">Sign in with TikTok, link a Solana wallet, and everything credited to your handle is sent to you.</p>
          </div>
          <Link href="/claim" className="btn btn-accent">Claim your earnings</Link>
        </div>
      </section>
    </div>
  );
}
