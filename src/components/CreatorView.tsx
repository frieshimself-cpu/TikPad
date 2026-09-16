"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { Box, NotFound } from "./TokenView";
import { fmtSol, fmtUsd, short, timeAgo } from "@/lib/format";
import { normalizeHandle, profileUrl } from "@/lib/handle";
import { balanceFor, getCreator, nextMilestoneCents, payoutsFor, tokensFor, useStore } from "@/lib/store";

export function CreatorView({ handle: raw }: { handle: string }) {
  const state = useStore();
  const handle = normalizeHandle(decodeURIComponent(raw));
  if (!state) return <Skeleton className="h-64" />;
  if (!handle) return <NotFound what="creator" />;
  const creator = getCreator(state, handle);
  const tokens = tokensFor(state, handle);
  if (!creator && tokens.length === 0) return <NotFound what="creator" />;
  const bal = balanceFor(state, handle);
  const payouts = payoutsFor(state, handle).slice(0, 20);
  const linked = !!creator?.payout_wallet;

  return (
    <>
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar handle={handle} src={creator?.avatar_url} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">@{handle}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              {creator?.display_name && creator.display_name !== handle && <span>{creator.display_name}</span>}
              <a href={profileUrl(handle)} target="_blank" rel="noreferrer" className="hover:text-fg hover:underline">tiktok.com/@{handle} ↗</a>
              {linked ? <span className="pill pill-green">wallet linked</span> : <span className="pill">unclaimed</span>}
            </div>
          </div>
          <Link href="/claim" className="btn btn-accent">{linked ? "Creator dashboard" : "This is me"}</Link>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-4">
          <Box k="Lifetime earned" v={fmtUsd(bal.earned_cents)} s={fmtSol(bal.earned_lamports)} />
          <Box k="Paid out" v={fmtUsd(bal.paid_cents)} s={`${payouts.length} payout${payouts.length === 1 ? "" : "s"}`} />
          <Box k="Waiting" v={fmtUsd(bal.unpaid_cents)} s={linked ? `pays at ${fmtUsd(nextMilestoneCents(bal.paid_cents))}` : "until claimed"} />
          <Box k="Tokens" v={String(tokens.length)} s="routing fees here" />
        </dl>
      </div>

      <section className="card mt-6">
        <h2 className="border-b border-line px-5 py-3 text-sm font-medium">Tokens</h2>
        <ul className="divide-y divide-line">
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
        </ul>
      </section>

      {payouts.length > 0 && (
        <section className="card mt-6">
          <h2 className="border-b border-line px-5 py-3 text-sm font-medium">Payouts</h2>
          <ul className="divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="num text-xs text-dim">{timeAgo(p.ts)} · to {short(p.wallet)}</span>
                <span className="num text-green">{fmtUsd(p.usd_cents)} <span className="text-dim">· {fmtSol(p.lamports)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card mt-6 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <div className="font-semibold">Launch a token for @{handle}</div>
          <div className="text-sm text-muted">Anyone can. Fees route to this handle automatically.</div>
        </div>
        <Link href={`/launch?handle=${encodeURIComponent(handle)}`} className="btn btn-primary">Launch</Link>
      </div>
    </>
  );
}
