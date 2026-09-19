"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { TokenImage } from "./TokenImage";
import { Verified } from "./Verified";
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
          {st.payouts} payouts · {fmtUsd(st.paid_cents)} sent
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.length === 0 && <li className="px-5 py-10 text-center text-sm text-dim">Nothing yet. Launch the first token.</li>}
        {items.map((it) => {
          const tok = it.mint ? getToken(state, it.mint) : undefined;
          return (
            <li key={it.id} className={`flex items-center gap-4 px-5 py-3.5 transition hover:bg-bg/60 ${fresh.has(it.id) ? "feed-in" : ""}`}>
              <div className="relative shrink-0">
                {tok ? <TokenImage src={tok.image_url} symbol={tok.symbol} size={40} /> : <Avatar handle={it.handle} size={40} />}
                <span
                  className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[10px] text-white ${
                    it.kind === "payout" ? "bg-green" : it.kind === "launch" ? "bg-cyan" : "bg-fg"
                  }`}
                >
                  {it.kind === "payout" ? "$" : it.kind === "launch" ? "↑" : "+"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <FeedLine it={it} />
                <div className="num mt-0.5 text-xs text-dim">{timeAgo(it.ts)}</div>
              </div>
              <div className="num text-right">
                {it.kind === "launch" ? (
                  <span className="pill pill-cyan">launched</span>
                ) : (
                  <>
                    <div className={`font-semibold ${it.kind === "payout" ? "text-green" : ""}`}>{fmtUsd(it.usd_cents)}</div>
                    <div className="text-xs text-dim">{fmtSol(it.lamports)}</div>
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

function FeedLine({ it }: { it: FeedItem }) {
  const who = (
    <Link href={`/c/${it.handle}`} className="inline-flex items-center gap-1 font-semibold hover:underline">
      @{it.handle} <Verified size={13} />
    </Link>
  );
  const tok = it.mint ? (
    <Link href={`/t/${it.mint}`} className="num font-semibold text-[#0096d6] hover:underline">
      ${it.symbol ?? "?"}
    </Link>
  ) : null;
  if (it.kind === "payout") return <div className="truncate text-sm">Paid out to {who}</div>;
  if (it.kind === "launch") return <div className="truncate text-sm">{tok} launched for {who}</div>;
  return (
    <div className="truncate text-sm">
      {tok} fees credited to {who}
    </div>
  );
}
