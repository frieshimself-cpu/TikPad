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
  const top = state ? leaderboard(state, 8) : [];

  return (
    <div>
      <section className="glow px-6 pb-16 pt-14 sm:px-12 lg:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="pill pill-cyan">pump.fun · Solana · X Ads</span>
            <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
              Every trade buys your coin <span className="text-cyan">more ads.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Launch on AdPad and the coin&apos;s creator rewards become its advertising budget: X promoted posts, KOL promos and placements,
              funded automatically by volume. No marketing wallet, no dev promises.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-primary h-12 px-7 text-base">Launch a coin</Link>
              <Link href="/campaigns" className="btn btn-ghost h-12 px-7 text-base">See campaigns</Link>
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
            ["Ad budget raised", st ? fmtUsd(st.budget_cents) : "—", "from creator fees"],
            ["Spent on ads", st ? fmtUsd(st.spent_cents) : "—", `${st?.campaigns ?? 0} campaigns`],
            ["Impressions", st ? st.impressions.toLocaleString("en-US") : "—", "across X and partners"],
            ["Coins", st ? String(st.tokens) : "—", "advertising themselves"],
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
            <h2 className="mt-2 text-3xl font-bold">Launches, budgets and campaigns</h2>
            <div className="mt-6">{state ? <LiveFeed state={state} /> : <Skeleton className="h-96" />}</div>
          </div>
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="mt-2 text-3xl font-bold">Three steps</h2>
            <ol className="mt-6 space-y-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4 rounded-2xl bg-elev p-5">
                  <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-card text-sm font-bold text-cyan">{i + 1}</span>
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
                <h2 className="mt-2 text-3xl font-bold">Biggest ad budgets</h2>
              </div>
              <Link href="/campaigns" className="text-sm font-semibold text-cyan hover:underline">All campaigns →</Link>
            </div>
            <ol className="rail flex gap-4 overflow-x-auto px-6 pb-2 sm:px-12">
              {top.map((t, i) => (
                <li key={t.mint} className="w-60 shrink-0">
                  <Link href={`/t/${t.mint}`} className="card lift block p-5">
                    <div className="flex items-center justify-between">
                      <TokenImage src={t.image_url} symbol={t.symbol} size={48} />
                      <span className="num text-xs font-semibold text-dim">#{i + 1}</span>
                    </div>
                    <div className="mt-4 truncate font-bold">{t.name}</div>
                    <div className="num mt-1 text-2xl font-bold tracking-tight">{fmtUsd(t.earned_cents)}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <span>{t.campaigns} campaign{t.campaigns === 1 ? "" : "s"}</span>
                      <span className="pill">{fmtUsd(t.available_cents)} left</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="px-6 py-16 sm:px-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-line bg-[radial-gradient(600px_300px_at_20%_0%,rgb(245_197_66_/_0.18),transparent),#12121a] px-8 py-12 sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-3xl font-bold">Launch a coin that markets itself.</h3>
              <p className="mt-2 max-w-lg text-muted">One wallet confirmation. From the first trade, every creator reward goes to ads for your coin.</p>
            </div>
            <Link href="/launch" className="btn btn-primary h-12 px-7 text-base">Launch a coin</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
