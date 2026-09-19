"use client";

import Link from "next/link";
import { LiveFeed } from "./LiveFeed";
import { Avatar } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { HeroArt } from "./HeroArt";
import { ContractAddress } from "./ContractAddress";
import { Verified } from "./Verified";
import { fmtUsd } from "@/lib/format";
import { leaderboard, stats, useStore } from "@/lib/store";

const STEPS = [
  ["Launch", "Name, ticker, image, and the OnlyFans username that should get paid. FansPad creates the token on pump.fun with its treasury as the on-chain creator."],
  ["Fees accrue", "Every pump.fun trade pays a creator fee. The treasury is the creator, so the fees land with FansPad and are attributed to the token that produced them."],
  ["Creator gets paid", "80% of every claim is credited to the username. Once it crosses $5, then $10, $20, $50 and up, it's sent to the wallet the creator linked after verifying their profile."],
];

export function HomeView() {
  const state = useStore();
  const st = state ? stats(state) : null;
  const top = state ? leaderboard(state, 8) : [];

  return (
    <div>
      <section className="glow px-6 pb-16 pt-14 sm:px-12 lg:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="pill pill-cyan">pump.fun · Solana · OnlyFans</span>
            <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[1.02] sm:text-6xl">
              Token fees, paid to <span className="text-cyan">OnlyFans</span> creators.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Launch a token, point its creator fees at any OnlyFans creator, and FansPad pays them automatically. They don&apos;t need to do
              anything until they want to collect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-primary h-12 px-7 text-base">Launch a token</Link>
              <Link href="/claim" className="btn btn-ghost h-12 px-7 text-base">I&apos;m a creator</Link>
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

      <section className="px-6 sm:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Paid out", st ? fmtUsd(st.paid_cents) : "—", "to creators, in SOL"],
            ["Earned", st ? fmtUsd(st.earned_cents) : "—", "credited from fees"],
            ["Tokens", st ? String(st.tokens) : "—", "routing fees"],
            ["Creators", st ? String(st.creators) : "—", "with a balance"],
          ].map(([k, v, sub]) => (
            <div key={k} className="rounded-2xl bg-elev px-5 py-5">
              <div className="text-xs font-medium text-muted">{k}</div>
              <div className="num mt-1 text-3xl font-bold tracking-tight">{v}</div>
              <div className="mt-0.5 text-xs text-dim">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 sm:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 2xl:grid-cols-[1fr_400px]">
          <div>
            <div className="eyebrow">Activity</div>
            <h2 className="mt-2 text-3xl font-bold">Every launch, credit and payout</h2>
            <div className="mt-6">{state ? <LiveFeed state={state} /> : <Skeleton className="h-96" />}</div>
          </div>
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="mt-2 text-3xl font-bold">Three steps</h2>
            <ol className="mt-6 space-y-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4 rounded-2xl bg-elev p-5">
                  <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <div className="font-bold">{t}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {top.length > 0 && (
        <section className="border-t border-line bg-elev py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between px-6 sm:px-12">
              <div>
                <div className="eyebrow">Leaderboard</div>
                <h2 className="mt-2 text-3xl font-bold">Top creators</h2>
              </div>
              <Link href="/claim" className="text-sm font-semibold text-cyan hover:underline">Claim yours →</Link>
            </div>
            <ol className="rail flex gap-4 overflow-x-auto px-6 pb-2 sm:px-12">
              {top.map((c, i) => (
                <li key={c.handle} className="w-60 shrink-0">
                  <Link href={`/c/${c.handle}`} className="card lift block p-5">
                    <div className="flex items-center justify-between">
                      <Avatar handle={c.handle} src={c.avatar_url} size={52} />
                      <span className="num text-xs font-semibold text-dim">#{i + 1}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 truncate font-bold">@{c.handle} <Verified size={15} /></div>
                    <div className="num mt-1 text-2xl font-bold tracking-tight">{fmtUsd(c.earned_cents)}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <span>{c.token_count} token{c.token_count === 1 ? "" : "s"}</span>
                      <span className={`pill ${c.linked ? "pill-green" : ""}`}>{c.linked ? "linked" : "unclaimed"}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="px-6 py-16 sm:px-12">
        <div className="mx-auto max-w-6xl rounded-3xl bg-[linear-gradient(135deg,#00aff0,#38bdf8)] px-8 py-12 text-white sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-3xl font-bold">Is a token paying you?</h3>
              <p className="mt-2 max-w-lg text-white/85">Verify your OnlyFans profile, link a Solana wallet, and everything credited to your username is sent to you.</p>
            </div>
            <Link href="/claim" className="btn h-12 bg-white px-7 text-base text-[#0096d6] hover:bg-[#f0fafe]">Claim your earnings</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
