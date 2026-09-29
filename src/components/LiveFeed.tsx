"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TokenImage } from "./TokenImage";
import { fmtSol, fmtUsd, timeAgo } from "@/lib/format";
import { feed, getToken, startSimulation, stats, type FeedItem, type State } from "@/lib/store";

export function LiveFeed({ state, compact = false }: { state: State; compact?: boolean }) {
  const items = feed(state, compact ? 8 : 30);
  const st = stats(state);
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => startSimulation(), []);

  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(items.map((i) => i.id));
      return;
    }
    const next = new Set<string>();
    for (const it of items) if (!seen.current.has(it.id)) next.add(it.id);
    if (next.size) {
      for (const id of next) seen.current.add(id);
      const t = setTimeout(() => setFresh(next), 0);
      return () => clearTimeout(t);
    }
  }, [items]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="live-dot" />
          Live
        </div>
        <span className="num text-xs text-dim">
          {st.campaigns} campaigns · {fmtUsd(st.spent_cents)} spent on ads
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((it) => {
          const tok = getToken(state, it.mint);
          return (
            <li key={it.id} className={`flex items-center gap-4 px-5 py-3.5 transition hover:bg-elev/60 ${fresh.has(it.id) ? "feed-in" : ""}`}>
              <div className="relative shrink-0">
                <TokenImage src={tok?.image_url} symbol={it.symbol} size={40} />
                <span
                  className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold ${
                    it.kind === "campaign" ? "bg-cyan text-[#0a0a0f]" : it.kind === "launch" ? "bg-green text-[#0a0a0f]" : "bg-elev text-fg"
                  }`}
                >
                  {it.kind === "campaign" ? "Ad" : it.kind === "launch" ? "↑" : "+"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <Line it={it} />
                <div className="num mt-0.5 text-xs text-dim">{timeAgo(it.ts)}</div>
              </div>
              <div className="num text-right">
                {it.kind === "launch" ? (
                  <span className="pill pill-green">launched</span>
                ) : (
                  <>
                    <div className={`font-semibold ${it.kind === "campaign" ? "text-cyan" : ""}`}>{it.kind === "campaign" ? "−" : "+"}{fmtUsd(it.usd_cents)}</div>
                    {it.lamports > 0 && <div className="text-xs text-dim">{fmtSol(it.lamports)}</div>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Line({ it }: { it: FeedItem }) {
  const tok = (
    <Link href={`/t/${it.mint}`} className="num font-semibold hover:underline">
      ${it.symbol}
    </Link>
  );
  if (it.kind === "campaign") return <div className="truncate text-sm">{tok} · {it.label} ran</div>;
  if (it.kind === "launch") return <div className="truncate text-sm">{tok} launched, fees now fund its ads</div>;
  return <div className="truncate text-sm">{tok} creator fees → ad budget</div>;
}
