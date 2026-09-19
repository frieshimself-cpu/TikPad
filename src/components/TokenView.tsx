"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { fmtSol, fmtUsd, short, timeAgo } from "@/lib/format";
import { balanceForMint, creditsForMint, getToken, useStore } from "@/lib/store";

export function TokenView({ mint }: { mint: string }) {
  const state = useStore();
  if (!state) return <Skeleton className="h-64" />;
  const t = getToken(state, mint);
  if (!t) return <NotFound what="token" />;
  const bal = balanceForMint(state, mint);
  const credits = creditsForMint(state, mint).slice(0, 50);

  return (
    <>
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <TokenImage src={t.image_url} symbol={t.symbol} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{t.name}</h1>
              <span className="num text-muted">${t.symbol}</span>
              <span className="pill pill-cyan">preview</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              Fees route to
              <Link href={`/c/${t.recipient_handle}`} className="inline-flex items-center gap-1.5 font-medium text-fg hover:underline">
                <Avatar handle={t.recipient_handle} size={18} /> @{t.recipient_handle}
              </Link>
            </div>
          </div>
        </div>
        {t.description && <p className="mt-6 whitespace-pre-wrap text-sm text-muted">{t.description}</p>}
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Box k="Fees to creator" v={fmtUsd(bal.c)} s={fmtSol(bal.l)} />
          <Box k="Dev buy" v={fmtSol(t.dev_buy_lamports)} s={short(t.launcher_wallet)} />
          <Box k="Launched" v={timeAgo(t.created_at)} s={new Date(t.created_at).toLocaleDateString()} />
        </dl>
        <div className="mono mt-6 break-all text-xs text-dim">mint {t.mint}</div>
      </div>

      <section className="card mt-6">
        <h2 className="border-b border-line px-5 py-3 text-sm font-medium">Fee credits from this token</h2>
        {credits.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-dim">No creator fees claimed yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {credits.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="num text-xs text-dim">{timeAgo(c.ts)}</span>
                <span className="num">{fmtUsd(c.usd_cents)} <span className="text-dim">· {fmtSol(c.lamports)}</span></span>
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
      <h1 className="text-xl font-semibold">Unknown {what}</h1>
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
