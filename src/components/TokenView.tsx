"use client";

import Link from "next/link";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { fmtSol, fmtUsd, short, timeAgo } from "@/lib/format";
import { budgetFor, campaignsFor, creditsFor, getToken, useStore } from "@/lib/store";

export function TokenView({ mint }: { mint: string }) {
  const state = useStore();
  if (!state) return <Skeleton className="h-64" />;
  const t = getToken(state, mint);
  if (!t) return <NotFound what="coin" />;
  const b = budgetFor(state, mint);
  const campaigns = campaignsFor(state, mint);
  const credits = creditsFor(state, mint).slice(0, 30);
  const pct = b.earned_cents ? Math.min(100, Math.round((b.spent_cents / b.earned_cents) * 100)) : 0;

  return (
    <>
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <TokenImage src={t.image_url} symbol={t.symbol} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{t.name}</h1>
              <span className="num text-muted">${t.symbol}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
              {t.x_handle && <a href={`https://x.com/${t.x_handle}`} target="_blank" rel="noreferrer" className="hover:text-fg hover:underline">@{t.x_handle} ↗</a>}
              <a href={`https://pump.fun/coin/${t.mint}`} target="_blank" rel="noreferrer" className="hover:text-fg hover:underline">pump.fun ↗</a>
            </div>
          </div>
        </div>
        {t.description && <p className="mt-6 whitespace-pre-wrap text-sm text-muted">{t.description}</p>}
        <dl className="mt-6 grid gap-3 sm:grid-cols-4">
          <Box k="Ad budget raised" v={fmtUsd(b.earned_cents)} s={fmtSol(b.earned_lamports)} />
          <Box k="Spent on ads" v={fmtUsd(b.spent_cents)} s={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`} />
          <Box k="Available" v={fmtUsd(b.available_cents)} s="next campaign" />
          <Box k="Launched" v={timeAgo(t.created_at)} s={short(t.launcher_wallet)} />
        </dl>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-elev">
          <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
        </div>
        <div className="mono mt-6 break-all text-xs text-dim">mint {t.mint}</div>
      </div>

      <section className="card mt-6">
        <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-dim">No campaigns yet. The first runs once the budget clears $20.</p>
        ) : (
          <ul className="divide-y divide-line">
            {campaigns.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium">{c.type}</div>
                  <div className="num text-xs text-dim">{c.impressions.toLocaleString("en-US")} impressions · {timeAgo(c.ts)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num font-semibold text-cyan">{fmtUsd(c.usd_cents)}</span>
                  <span className={`pill ${c.status === "live" ? "pill-green" : ""}`}>{c.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-6">
        <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Creator fees into the budget</h2>
        {credits.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-dim">Fees show up here after each claim.</p>
        ) : (
          <ul className="divide-y divide-line">
            {credits.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="num text-xs text-dim">{timeAgo(c.ts)}</span>
                <span className="num">+{fmtUsd(c.usd_cents)} <span className="text-dim">· {fmtSol(c.lamports)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function NotFound({ what }: { what: string }) {
  return (
    <div className="card p-10 text-center">
      <h1 className="text-3xl">Unknown {what}</h1>
      <p className="mt-2 text-sm text-muted">Preview data lives in your browser, so links only work on the device where they were created.</p>
      <Link href="/" className="btn btn-ghost mt-6">Back home</Link>
    </div>
  );
}

export function Box({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="rounded-xl border border-line bg-elev p-3">
      <div className="text-xs text-dim">{k}</div>
      <div className="num mt-1 text-lg font-semibold">{v}</div>
      <div className="num truncate text-xs text-dim">{s}</div>
    </div>
  );
}
