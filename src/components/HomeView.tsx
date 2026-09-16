"use client";

import Link from "next/link";
import { LiveFeed } from "./LiveFeed";
import { Avatar } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { ContractAddress } from "./ContractAddress";
import { fmtUsd } from "@/lib/format";
import { leaderboard, stats, useStore } from "@/lib/store";

const STEPS = [
  ["Launch", "Fill in a name, ticker and image, and pick the TikTok @handle that should get paid. TikPad creates the token on pump.fun with its treasury as the on-chain creator."],
  ["Fees accrue", "Every trade on pump.fun pays a creator fee. Because the treasury is the creator, those fees land with TikPad and are attributed to the token that produced them."],
  ["Creator gets paid", "80% of every claim is credited to the TikTok handle. When the balance crosses $5, then $10, $20, $50 and so on, it is sent to the wallet the creator linked by signing in with TikTok."],
];

export function HomeView() {
  const state = useStore();
  const st = state ? stats(state) : null;
  const top = state ? leaderboard(state, 8) : [];

  return (
    <div>
      {/* Hero: centered, full width */}
      <section className="glow border-b border-line px-6 py-20 text-center sm:px-10 sm:py-28">
        <span className="pill pill-cyan">pump.fun · Solana · TikTok</span>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl">
          Token fees, paid to <span className="bg-[#d9f99d] px-2">TikTok</span> creators.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Launch a token, point its creator fees at any TikTok handle, and TikPad pays the creator out automatically. No account needed on their
          side until they want to collect.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/launch" className="btn btn-primary h-12 px-6 text-base">Launch a token</Link>
          <Link href="/claim" className="btn btn-accent h-12 px-6 text-base">I&apos;m a creator</Link>
        </div>
        <div className="mx-auto mt-10 max-w-2xl text-left">
          <ContractAddress />
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 divide-x divide-line border-b border-line bg-card md:grid-cols-4">
        {[
          ["Paid out", st ? fmtUsd(st.paid_cents) : "—"],
          ["Earned", st ? fmtUsd(st.earned_cents) : "—"],
          ["Tokens", st ? String(st.tokens) : "—"],
          ["Creators", st ? String(st.creators) : "—"],
        ].map(([k, v]) => (
          <div key={k} className="px-6 py-6 sm:px-10">
            <div className="text-xs font-bold uppercase tracking-widest text-dim">{k}</div>
            <div className="num mt-1 text-3xl font-bold">{v}</div>
          </div>
        ))}
      </section>

      {/* Feed, full width */}
      <section className="px-6 py-14 sm:px-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Live activity</h2>
          <span className="text-sm text-muted">Every launch, fee credit and payout</span>
        </div>
        {state ? <LiveFeed state={state} /> : <Skeleton className="h-96" />}
      </section>

      {/* Timeline */}
      <section className="border-y border-line bg-card px-6 py-14 sm:px-10">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="mt-8 max-w-3xl">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="relative flex gap-6 pb-10 last:pb-0">
              {i < STEPS.length - 1 && <span className="absolute left-5 top-11 h-[calc(100%-2.5rem)] w-px bg-line-strong" aria-hidden />}
              <span className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-fg text-sm font-bold text-bg">{i + 1}</span>
              <div>
                <div className="text-xl font-bold">{t}</div>
                <p className="mt-1 leading-relaxed text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Creator rail */}
      {top.length > 0 && (
        <section className="py-14">
          <div className="mb-6 flex items-end justify-between px-6 sm:px-10">
            <h2 className="text-3xl font-bold">Top creators</h2>
            <Link href="/claim" className="text-sm font-semibold uppercase tracking-wide text-muted hover:text-fg">Claim yours →</Link>
          </div>
          <ol className="rail flex gap-4 overflow-x-auto px-6 pb-2 sm:px-10">
            {top.map((c, i) => (
              <li key={c.handle} className="w-56 shrink-0">
                <Link href={`/c/${c.handle}`} className="card block p-5 transition hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <Avatar handle={c.handle} src={c.avatar_url} size={44} />
                    <span className="num text-xs text-dim">#{i + 1}</span>
                  </div>
                  <div className="mt-4 truncate font-bold">@{c.handle}</div>
                  <div className="num mt-1 text-2xl font-bold">{fmtUsd(c.earned_cents)}</div>
                  <div className="mt-1 text-xs text-muted">
                    {c.token_count} token{c.token_count === 1 ? "" : "s"} · {c.linked ? "wallet linked" : "unclaimed"}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
