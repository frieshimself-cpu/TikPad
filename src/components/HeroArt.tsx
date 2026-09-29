"use client";

import { Avatar } from "./Avatar";
import { Verified } from "./Verified";

/** A clean creator profile card with a payout attached. */
export function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-[400px]" aria-hidden>
      <div className="float-c overflow-hidden rounded-3xl border border-line bg-card shadow-[0_40px_100px_-40px_rgba(120,90,255,0.45)]">
        <div className="h-28 bg-[radial-gradient(400px_160px_at_30%_120%,rgb(184_166_255_/_0.5),transparent),linear-gradient(135deg,#1c1930,#2b2450)]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <span className="rounded-full border-4 border-card"><Avatar handle="lunavale" size={80} /></span>
            <span className="btn btn-accent h-9 px-4 text-sm">Fees routed</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-lg font-bold">
            Luna Vale <Verified size={18} />
          </div>
          <div className="text-sm text-muted">@lunavale · x.com/lunavale</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[["48.2K", "followers"], ["$LUNA", "token"], ["80%", "of fees"]].map(([v, k]) => (
              <div key={k} className="rounded-2xl bg-elev py-3">
                <div className="num font-bold">{v}</div>
                <div className="text-xs text-muted">{k}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-line p-4">
            <div>
              <div className="text-xs text-muted">Latest payout</div>
              <div className="num text-2xl font-bold tracking-tight">$171.38</div>
              <div className="num text-xs text-muted">1.143 SOL · next milestone $250</div>
            </div>
            <span className="pill pill-green">Paid</span>
          </div>
        </div>
      </div>
      <div className="float-b absolute -bottom-6 -left-8 hidden rounded-2xl border border-line bg-card px-4 py-3 shadow-lg xl:block">
        <div className="text-xs text-muted">Creator fees today</div>
        <div className="num font-bold text-cyan">+0.41 SOL</div>
      </div>
    </div>
  );
}
