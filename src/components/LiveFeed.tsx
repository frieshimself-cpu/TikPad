"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { fmtSol, fmtUsd, timeAgo } from "@/lib/format";
import { feed, startSimulation, stats, type FeedItem, type State } from "@/lib/store";

export function LiveFeed({ state, compact = false }: { state: State; compact?: boolean }) {
  const items = feed(state, compact ? 8 : 40);
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
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="live-dot" />
          Live activity
        </div>
        <span className="num text-xs text-dim">
          {st.payouts} payouts · {fmtUsd(st.paid_cents)} sent
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-dim">Nothing yet. Launch the first token.</li>}
        {items.map((it) => (
          <li key={it.id} className={`flex items-center gap-3 px-4 py-3 ${fresh.has(it.id) ? "feed-in" : ""}`}>
            <Avatar handle={it.handle} size={32} />
            <div className="min-w-0 flex-1 text-sm">
              <FeedLine it={it} />
              <div className="num mt-0.5 text-xs text-dim">{timeAgo(it.ts)}</div>
            </div>
            <div className="num text-right text-sm">
              {it.kind === "launch" ? (
                <span className="pill pill-cyan">launched</span>
              ) : (
                <>
                  <div className={it.kind === "payout" ? "text-green" : "text-fg"}>{fmtUsd(it.usd_cents)}</div>
                  <div className="text-xs text-dim">{fmtSol(it.lamports)}</div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeedLine({ it }: { it: FeedItem }) {
  const who = (
    <Link href={`/c/${it.handle}`} className="font-medium hover:underline">
      @{it.handle}
    </Link>
  );
  const tok = it.mint ? (
    <Link href={`/t/${it.mint}`} className="num text-muted hover:text-fg hover:underline">
      ${it.symbol ?? "?"}
    </Link>
  ) : null;
  if (it.kind === "payout") return <div className="truncate">Paid {who}</div>;
  if (it.kind === "launch") return <div className="truncate">{tok} launched for {who}</div>;
  return <div className="truncate">{tok} fees credited to {who}</div>;
}
