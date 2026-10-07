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
  image_url: string | null;
  launcher_wallet: string;
  dev_buy_lamports: number;
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

export function RecentLaunches({ limit = 12 }: { limit?: number }) {
  const data = useLaunches();
  if (!data) return <Skeleton className="h-72" />;
  const tokens = data.tokens.slice(0, limit);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="text-sm font-semibold">Launched here</div>
        <span className="num text-xs text-dim">{data.tokens.length} coin{data.tokens.length === 1 ? "" : "s"}</span>
      </div>
      <ul className="divide-y divide-line">
        {tokens.length === 0 && <li className="px-5 py-10 text-center text-sm text-dim">Nothing yet. Launch the first coin.</li>}
        {tokens.map((t) => (
          <li key={t.mint} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-elev/60">
            <TokenImage src={t.image_url} symbol={t.symbol} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Link href={`/t/${t.mint}`} className="truncate font-semibold hover:underline">{t.name}</Link>
                <span className="num text-muted">${t.symbol}</span>
                <span className="stamp stamp-green hidden !rotate-0 !text-[9px] sm:inline-block">Human-made</span>
              </div>
              <div className="num mt-0.5 text-xs text-dim">
                by {short(t.launcher_wallet)} · {timeAgo(t.created_at)}
                {t.dev_buy_lamports > 0 ? ` · dev buy ${fmtSol(t.dev_buy_lamports)}` : ""}
              </div>
            </div>
            <a href={pumpUrl(t.mint)} target="_blank" rel="noreferrer" className="btn btn-ghost h-9 px-3 text-xs">pump.fun ↗</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
