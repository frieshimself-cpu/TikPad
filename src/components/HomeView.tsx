"use client";

import Link from "next/link";
import { LiveFeed } from "./LiveFeed";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { ContractAddress } from "./ContractAddress";
import { HeroArt } from "./HeroArt";
import { fmtUsd } from "@/lib/format";
import { leaderboard, stats, useStore } from "@/lib/store";

const STEPS = [
  ["Launch", "Name, ticker, image, links and a dev buy. AdPad creates the coin on pump.fun with its treasury as the on-chain creator, so every creator reward routes to the ad budget."],
  ["Fees become budget", "Every trade pays a creator fee. The treasury claims it every two minutes and credits 90% to that coin's ad budget."],
  ["Ads run", "AdPad spends the budget on X promoted posts, KOL promos, trend pushes and DEX banners for that coin, and shows every campaign here."],
];

export function HomeView() {
  const state = useStore();
  const st = state ? stats(state) : null;
  const top = state ? leaderboard(state, 6) : [];

  return (
    <div>
      {/* Hero: centered copy, dashboard card below */}
      <section className="glow">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
          <span className="pill pill-cyan">pump.fun · Solana · X Ads</span>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.0] tracking-tight sm:text-7xl">
            Every trade buys your coin <span className="text-cyan">more ads.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Launch on AdPad and the coin&apos;s creator rewards become its advertising budget: X promoted posts, KOL promos and placements,
            funded automatically by volume. No marketing wallet, no dev promises.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/launch" className="btn btn-primary h-12 px-7 text-base">Launch a coin</Link>
            <Link href="/campaigns" className="btn btn-ghost h-12 px-7 text-base">See campaigns</Link>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl items-stretch gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[420px_1fr]">
          <div className="hidden lg:block"><HeroArt /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Ad budget raised", st ? fmtUsd(st.budget_cents) : "—", "from creator fees"],
              ["Spent on ads", st ? fmtUsd(st.spent_cents) : "—", `${st?.campaigns ?? 0} campaigns`],
              ["Impressions", st ? st.impressions.toLocaleString("en-US") : "—", "across X and partners"],
              ["Coins", st ? String(st.tokens) : "—", "advertising themselves"],
            ].map(([k, v, sub]) => (
              <div key={k} className="card flex flex-col justify-between p-6">
                <div className="text-sm font-medium text-muted">{k}</div>
                <div>
                  <div className="num mt-4 text-4xl font-extrabold tracking-tight">{v}</div>
                  <div className="mt-1 text-xs text-dim">{sub}</div>
                </div>
              </div>
            ))}
            <div className="sm:col-span-2"><ContractAddress /></div>
          </div>
        </div>
      </section>

      {/* How it works: three columns */}
      <section className="border-y border-line bg-elev">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 text-3xl font-bold">Three steps, zero marketing wallet</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="card p-6">
                <span className="num flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-sm font-bold text-[#0a0a0f]">{i + 1}</span>
                <div className="mt-4 text-lg font-bold">{t}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Leaderboard grid + feed */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex items-end justify-between">
              <div>
                <div className="eyebrow">Leaderboard</div>
                <h2 className="mt-2 text-3xl font-bold">Biggest ad budgets</h2>
              </div>
              <Link href="/campaigns" className="text-sm font-semibold text-cyan hover:underline">All →</Link>
            </div>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {top.map((t, i) => (
                <li key={t.mint}>
                  <Link href={`/t/${t.mint}`} className="card lift flex items-center gap-3 p-4">
                    <span className="num w-5 text-xs font-semibold text-dim">{i + 1}</span>
                    <TokenImage src={t.image_url} symbol={t.symbol} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{t.name}</div>
                      <div className="text-xs text-muted">{t.campaigns} campaign{t.campaigns === 1 ? "" : "s"}</div>
                    </div>
                    <div className="num text-right text-sm font-semibold">{fmtUsd(t.earned_cents)}</div>
                  </Link>
                </li>
              ))}
              {top.length === 0 && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}
            </ol>
          </div>
          <div>
            <div className="eyebrow">Activity</div>
            <h2 className="mt-2 text-3xl font-bold">Launches, budgets, campaigns</h2>
            <div className="mt-6">{state ? <LiveFeed state={state} compact /> : <Skeleton className="h-96" />}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <div className="rounded-3xl border border-line bg-[radial-gradient(600px_300px_at_20%_0%,rgb(245_197_66_/_0.18),transparent),#12121a] px-8 py-12 text-center sm:px-12">
          <h3 className="text-3xl font-bold">Launch a coin that markets itself.</h3>
          <p className="mx-auto mt-2 max-w-lg text-muted">One wallet confirmation. From the first trade, every creator reward goes to ads for your coin.</p>
          <Link href="/launch" className="btn btn-primary mt-6 h-12 px-7 text-base">Launch a coin</Link>
        </div>
      </section>
    </div>
  );
}
