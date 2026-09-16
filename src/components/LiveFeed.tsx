"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { fmtSol, fmtUsd, timeAgo } from "@/lib/format";
import type { FeedItem } from "@/lib/db";

interface Payload {
  demo: boolean;
  feed: FeedItem[];
  stats: { tokens: number; creators: number; paid_cents: number; payouts: number; earned_cents: number };
}

export function LiveFeed({ initial, compact = false }: { initial: Payload; compact?: boolean }) {
  const [data, setData] = useState(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/feed", { cache: "no-store" });
        const j = (await r.json()) as Payload;
        if (!alive) return;
        setData((prev) => {
          const seen = new Set(prev.feed.map(keyOf));
          const next = new Set<string>();
          for (const it of j.feed) if (!seen.has(keyOf(it))) next.add(keyOf(it));
          if (next.size) setFresh(next);
          return j;
        });
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(tick, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const items = compact ? data.feed.slice(0, 8) : data.feed;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="live-dot" />
          Live activity
        </div>
        <span className="num text-xs text-dim">{data.stats.payouts} payouts · {fmtUsd(data.stats.paid_cents)} sent</span>
      </div>
      <ul className="divide-y divide-line">
        {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-dim">Nothing yet. Launch the first token.</li>}
        {items.map((it) => (
          <li key={keyOf(it)} className={`flex items-center gap-3 px-4 py-3 ${fresh.has(keyOf(it)) ? "feed-in" : ""}`}>
            <Avatar handle={it.handle} size={32} />
            <div className="min-w-0 flex-1 text-sm">
              <FeedLine it={it} />
              <div className="num mt-0.5 text-xs text-dim">
                {timeAgo(it.ts)}
                {it.demo ? " · demo" : ""}
              </div>
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
  return (
    <div className="truncate">
      {tok} fees credited to {who}
    </div>
  );
}

const keyOf = (it: FeedItem) => `${it.kind}:${it.ref ?? ""}:${it.handle}:${it.ts}`;
