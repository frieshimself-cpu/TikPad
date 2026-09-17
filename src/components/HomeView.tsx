"use client";

import Link from "next/link";
import { LiveFeed } from "./LiveFeed";
import { Avatar } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { ContractAddress } from "./ContractAddress";
import { HeroArt } from "./HeroArt";
import { fmtUsd } from "@/lib/format";
import { leaderboard, stats, useStore } from "@/lib/store";

const STEPS = [
  ["Launch", "Name, ticker, image, and the TikTok @handle that should get paid. TikPad creates the token on pump.fun with its treasury as the on-chain creator.", "M5 19 19 5M9 5h10v10"],
  ["Fees accrue", "Every pump.fun trade pays a creator fee. The treasury is the creator, so the fees land with TikPad and are attributed to the token that produced them.", "M4 17l5-5 4 4 7-8M15 8h5v5"],
  ["Creator gets paid", "80% of every claim is credited to the handle. Once it crosses $5, then $10, $20, $50 and up, it's sent to the wallet the creator linked with a TikTok sign-in.", "M12 3v18M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8"],
];

export function HomeView() {
  const state = useStore();
  const st = state ? stats(state) : null;
  const top = state ? leaderboard(state, 8) : [];

  return (
    <div>
      {/* Hero */}
      <section className="glow border-b border-line px-6 pb-16 pt-14 sm:px-10 lg:pt-20">
        <div className="grid items-center gap-12 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="pill pill-cyan">pump.fun · Solana · TikTok</span>
            <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl 2xl:text-7xl">
              Token fees, paid straight to <span className="relative inline-block px-2"><span className="absolute inset-0 -rotate-1 rounded-lg bg-[#d9f99d]" aria-hidden /><span className="relative">TikTok</span></span> creators.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Launch a token, point its creator fees at any TikTok handle, and TikPad pays the creator automatically. They don&apos;t need an
              account until they want to collect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-primary h-12 px-6 text-base">Launch a token</Link>
              <Link href="/claim" className="btn btn-accent h-12 px-6 text-base">I&apos;m a creator</Link>
            </div>
            <div className="mt-10 max-w-xl">
              <ContractAddress />
            </div>
          </div>
          <div className="hidden xl:block">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 divide-x divide-line border-b border-line bg-card md:grid-cols-4">
        {[
          ["Paid out", st ? fmtUsd(st.paid_cents) : "—", "to creators, in SOL"],
          ["Earned", st ? fmtUsd(st.earned_cents) : "—", "credited from fees"],
          ["Tokens", st ? String(st.tokens) : "—", "routing fees"],
          ["Creators", st ? String(st.creators) : "—", "with a balance"],
        ].map(([k, v, sub]) => (
          <div key={k} className="px-6 py-6 sm:px-10">
            <div className="text-[11px] font-bold uppercase tracking-widest text-dim">{k}</div>
            <div className="num mt-1 text-3xl font-bold tracking-tight">{v}</div>
            <div className="mt-0.5 text-xs text-muted">{sub}</div>
          </div>
        ))}
      </section>

      {/* Feed + steps side by side on wide screens */}
      <section className="grid gap-10 px-6 py-14 sm:px-10 2xl:grid-cols-[1fr_420px]">
        <div>
          <div className="eyebrow">Activity</div>
          <h2 className="mt-2 text-3xl font-bold">Every launch, credit and payout</h2>
          <div className="mt-6">{state ? <LiveFeed state={state} /> : <Skeleton className="h-96" />}</div>
        </div>
        <div>
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 text-3xl font-bold">Three steps</h2>
          <ol className="mt-6 space-y-4">
            {STEPS.map(([t, d, icon], i) => (
              <li key={t} className="card lift p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ede9fe] text-cyan">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={icon} />
                    </svg>
                  </span>
                  <div className="num text-xs font-bold text-dim">0{i + 1}</div>
                  <div className="text-lg font-bold">{t}</div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Creator rail */}
      {top.length > 0 && (
        <section className="border-t border-line bg-card py-14">
          <div className="mb-6 flex items-end justify-between px-6 sm:px-10">
            <div>
              <div className="eyebrow">Leaderboard</div>
              <h2 className="mt-2 text-3xl font-bold">Top creators</h2>
            </div>
            <Link href="/claim" className="text-sm font-semibold text-muted hover:text-fg">Claim yours →</Link>
          </div>
          <ol className="rail flex gap-4 overflow-x-auto px-6 pb-4 sm:px-10">
            {top.map((c, i) => (
              <li key={c.handle} className="w-60 shrink-0">
                <Link href={`/c/${c.handle}`} className="card lift block bg-bg p-5">
                  <div className="flex items-center justify-between">
                    <Avatar handle={c.handle} src={c.avatar_url} size={48} />
                    <span className="num rounded-full bg-elev px-2 py-0.5 text-xs font-bold text-muted">#{i + 1}</span>
                  </div>
                  <div className="mt-4 truncate font-bold">@{c.handle}</div>
                  <div className="num mt-1 text-2xl font-bold tracking-tight">{fmtUsd(c.earned_cents)}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <span>{c.token_count} token{c.token_count === 1 ? "" : "s"}</span>
                    <span className={`pill ${c.linked ? "pill-green" : ""}`}>{c.linked ? "linked" : "unclaimed"}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* CTA band */}
      <section className="px-6 py-14 sm:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-fg px-8 py-12 text-white sm:px-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6d28d9] opacity-60 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#d9f99d] opacity-40 blur-3xl" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-3xl font-bold">Is a token paying you?</h3>
              <p className="mt-2 max-w-lg text-white/70">Sign in with TikTok, link a Solana wallet, and everything credited to your handle is sent to you.</p>
            </div>
            <Link href="/claim" className="btn btn-accent h-12 px-6 text-base">Claim your earnings</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
