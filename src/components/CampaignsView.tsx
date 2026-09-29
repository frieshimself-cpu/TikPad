"use client";

import Link from "next/link";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { fmtUsd, timeAgo } from "@/lib/format";
import { getToken, leaderboard, useStore } from "@/lib/store";

export function CampaignsView() {
  const state = useStore();
  if (!state) return <Skeleton className="h-96" />;
  const coins = leaderboard(state, 100);
  const campaigns = [...state.campaigns].sort((a, b) => b.ts - a.ts);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Ad budgets by coin</h2>
        <ul className="divide-y divide-line">
          {coins.map((t) => {
            const pct = t.earned_cents ? Math.min(100, Math.round((t.spent_cents / t.earned_cents) * 100)) : 0;
            return (
              <li key={t.mint} className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <TokenImage src={t.image_url} symbol={t.symbol} size={40} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/t/${t.mint}`} className="font-bold hover:underline">{t.name}</Link>
                    <div className="num text-xs text-muted">${t.symbol}{t.x_handle ? ` · @${t.x_handle}` : ""}</div>
                  </div>
                  <div className="num text-right">
                    <div className="font-semibold">{fmtUsd(t.earned_cents)}</div>
                    <div className="text-xs text-muted">{fmtUsd(t.available_cents)} available</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elev">
                  <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="card overflow-hidden self-start">
        <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Recent campaigns</h2>
        <ul className="divide-y divide-line">
          {campaigns.slice(0, 20).map((c) => (
            <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="min-w-0">
                <div className="truncate">
                  <Link href={`/t/${c.mint}`} className="num font-semibold hover:underline">${getToken(state, c.mint)?.symbol ?? "?"}</Link> · {c.type}
                </div>
                <div className="num text-xs text-dim">{c.impressions.toLocaleString("en-US")} impressions · {timeAgo(c.ts)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="num font-semibold text-cyan">{fmtUsd(c.usd_cents)}</span>
                <span className={`pill ${c.status === "live" ? "pill-green" : ""}`}>{c.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
