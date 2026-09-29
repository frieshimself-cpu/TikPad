"use client";

import { TokenImage } from "./TokenImage";

/** Ad-budget dashboard card for the hero. */
export function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden>
      <div className="float-c overflow-hidden rounded-3xl border border-line bg-card shadow-[0_40px_100px_-40px_rgba(245,197,66,0.35)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <TokenImage src={null} symbol="MCAT" size={40} />
            <div>
              <div className="font-bold">Moon Cat</div>
              <div className="num text-xs text-muted">$MCAT · @mooncatsol</div>
            </div>
          </div>
          <span className="pill pill-green">campaign live</span>
        </div>
        <div className="px-6 py-5">
          <div className="text-xs text-muted">Ad budget from creator fees</div>
          <div className="num mt-1 text-4xl font-bold tracking-tight">$1,284.10</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-elev">
            <div className="h-full w-[62%] rounded-full bg-cyan" />
          </div>
          <div className="num mt-2 flex justify-between text-xs text-muted">
            <span>$796 spent</span>
            <span>$488 available</span>
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              ["X promoted post", "$320", "41K impressions"],
              ["KOL promo", "$400", "3 creators"],
              ["X trend push", "$76", "queued"],
            ].map(([t, a, m]) => (
              <li key={t} className="flex items-center justify-between rounded-xl bg-elev px-3 py-2.5">
                <span className="font-medium">{t}</span>
                <span className="num text-xs text-muted">{a} · {m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
