"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TokenImage } from "./TokenImage";
import { Skeleton } from "./Skeleton";
import { fmtSol, short, timeAgo } from "@/lib/format";
import { pumpUrl } from "@/lib/brand";

export interface TokenRow {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string | null;
  launcher_wallet: string;
  dev_buy_lamports: number;
  verdict_json: string | null;
  created_at: number;
}
export interface GateTotals {
  checked: number;
  blocked: number;
}

export function useLaunches() {
  const [data, setData] = useState<{ tokens: TokenRow[]; gate: GateTotals } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/tokens")
        .then((r) => r.json())
        .then((d) => alive && !d.error && setData(d))
        .catch(() => alive && setData((d) => d ?? { tokens: [], gate: { checked: 0, blocked: 0 } }));
    load();
    const t = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return data;
}

/** Compact list for the home page. */
export function RecentLaunches({ limit = 8 }: { limit?: number }) {
  const data = useLaunches();
  if (!data) return <Skeleton className="h-72" />;
  const tokens = data.tokens.slice(0, limit);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b-[3px] border-line px-5 py-3">
        <div className="font-display text-lg">launched here</div>
        <Link href="/coins" className="font-display text-sm hover:scribble">
          see all {data.tokens.length} →
        </Link>
      </div>
      <ul className="divide-y-[2px] divide-dashed divide-line">
        {tokens.length === 0 && <li className="px-5 py-10 text-center text-dim">nothing yet. be the first one.</li>}
        {tokens.map((t) => (
          <li key={t.mint} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-elev/60">
            <TokenImage src={t.image_url} symbol={t.symbol} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/t/${t.mint}`} className="truncate font-display hover:underline">{t.name}</Link>
                <span className="num text-muted">${t.symbol}</span>
                <span className="stamp stamp-green hidden !rotate-0 !text-[10px] sm:inline-block">human-made</span>
              </div>
              <div className="num mt-0.5 text-xs text-dim">
                by {short(t.launcher_wallet)} · {timeAgo(t.created_at)}
                {t.dev_buy_lamports > 0 ? ` · dev buy ${fmtSol(t.dev_buy_lamports)}` : ""}
              </div>
            </div>
            <a href={pumpUrl(t.mint)} target="_blank" rel="noreferrer" className="btn btn-ghost h-9 px-3 text-sm">pump.fun →</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function verdictLine(json: string | null): string | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as { aiProbability?: number; detectors?: string[] };
    if (typeof v.aiProbability !== "number") return null;
    return `${Math.round(v.aiProbability * 100)}% AI · checked by ${(v.detectors ?? []).join(" + ") || "the gate"}`;
  } catch {
    return null;
  }
}

/** The full wall of coins that passed, for /coins. */
export function CoinGallery() {
  const data = useLaunches();
  if (!data) return <Skeleton className="h-96" />;
  if (data.tokens.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="font-display text-2xl">nothing here yet</div>
        <p className="mt-2 text-muted">no coin has made it through the gate on this server yet. yours could be the first.</p>
        <Link href="/launch" className="btn btn-primary mt-6">launch a coin</Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.tokens.map((t, i) => (
        <li key={t.mint} className={`card lift flex flex-col overflow-hidden ${i % 3 === 0 ? "tilt-l" : i % 3 === 2 ? "tilt-r" : ""}`}>
          <Link href={`/t/${t.mint}`} className="relative block border-b-[3px] border-line bg-elev">
            <TokenImage src={t.image_url} symbol={t.symbol} size={400} square />
            <span className="stamp stamp-green absolute right-3 top-3">human-made</span>
          </Link>
          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-baseline gap-2">
              <Link href={`/t/${t.mint}`} className="truncate font-display text-xl hover:underline">{t.name}</Link>
              <span className="num text-muted">${t.symbol}</span>
            </div>
            {t.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{t.description}</p>}
            <div className="num mt-3 text-xs text-dim">
              by {short(t.launcher_wallet)} · {timeAgo(t.created_at)}
              {t.dev_buy_lamports > 0 ? ` · dev buy ${fmtSol(t.dev_buy_lamports)}` : ""}
            </div>
            {verdictLine(t.verdict_json) && <div className="num mt-1 text-xs text-green">{verdictLine(t.verdict_json)}</div>}
            <div className="mt-4 flex gap-2">
              <a href={pumpUrl(t.mint)} target="_blank" rel="noreferrer" className="btn btn-primary h-10 flex-1 text-sm">pump.fun →</a>
              <Link href={`/t/${t.mint}`} className="btn btn-ghost h-10 px-3 text-sm">details</Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
