"use client";

import { Avatar } from "./Avatar";

/** Floating "payout stack" illustration for the hero. Pure CSS/SVG, no assets. */
export function HeroArt() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[460px]" aria-hidden>
      {/* token card */}
      <div className="float-b absolute left-0 top-10 w-64 rounded-2xl border border-line bg-card p-4 shadow-[0_24px_60px_-30px_rgba(19,18,16,0.45)]">
        <div className="flex items-center gap-3">
          <span className="num flex h-11 w-11 items-center justify-center rounded-xl bg-fg text-xs font-bold text-white">KHABY</span>
          <div>
            <div className="font-bold">Khaby Coin</div>
            <div className="num text-xs text-dim">pump.fun · live</div>
          </div>
        </div>
        <div className="mt-4 h-16 w-full">
          <svg viewBox="0 0 240 64" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#6d28d9" stopOpacity="0.35" />
                <stop offset="1" stopColor="#6d28d9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 52 L30 46 L55 50 L80 34 L105 38 L130 22 L160 28 L190 12 L215 18 L240 4 L240 64 L0 64 Z" fill="url(#g)" />
            <path d="M0 52 L30 46 L55 50 L80 34 L105 38 L130 22 L160 28 L190 12 L215 18 L240 4" fill="none" stroke="#6d28d9" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">Creator fees today</span>
          <span className="num font-bold text-cyan">+0.41 SOL</span>
        </div>
      </div>

      {/* payout card */}
      <div className="float-a absolute right-0 top-40 w-72 rounded-2xl bg-fg p-5 text-white shadow-[0_30px_70px_-30px_rgba(19,18,16,0.7)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Payout sent</span>
          <span className="rounded-full bg-[#d9f99d] px-2 py-0.5 text-[11px] font-bold text-[#131210]">confirmed</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Avatar handle="khaby.lame" size={40} />
          <div>
            <div className="font-bold">@khaby.lame</div>
            <div className="num text-xs text-white/60">TikTok · 162M followers</div>
          </div>
        </div>
        <div className="num mt-5 text-4xl font-bold tracking-tight">$171.38</div>
        <div className="num mt-1 text-xs text-white/60">1.143 SOL · milestone $250 next</div>
      </div>

      {/* floating chips */}
      <div className="float-c absolute left-2 top-[372px] rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold shadow-md">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green" />
        Fees to @khaby.lame via TikPad
      </div>
      <div className="float-c absolute right-8 top-2 rounded-full bg-[#d9f99d] px-3 py-1.5 text-xs font-bold shadow-md [animation-delay:1.2s]">80% to the creator</div>
    </div>
  );
}
