/** Two coin images going through the gate: one stamped human-made, one rejected. */
export function HeroArt() {
  return (
    <div className="relative mx-auto h-[480px] w-full max-w-[420px]" aria-hidden>
      <Card className="float-a absolute left-0 top-6 w-[250px] rotate-[-4deg]" ok name="$BRUSH" sub="Hand-painted, 2024" verdict="Human-made" />
      <Card className="float-b absolute right-0 top-36 w-[250px] rotate-[3deg]" ok={false} name="$SLOP" sub="Midjourney v6 · metadata" verdict="AI detected" />
      <div className="absolute bottom-0 left-1/2 w-[260px] -translate-x-1/2 rounded-2xl border border-line bg-card px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Gate</span>
          <span className="pill pill-green h-6 text-[11px]">1 of 2 deployed</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
          <span className="h-1.5 flex-1 rounded-full bg-green" />
          <span className="h-1.5 flex-1 rounded-full bg-rose" />
        </div>
      </div>
    </div>
  );
}

function Card({ className, ok, name, sub, verdict }: { className: string; ok: boolean; name: string; sub: string; verdict: string }) {
  return (
    <div className={`${className} overflow-hidden rounded-2xl border border-line bg-card shadow-[0_30px_60px_-30px_rgb(22_21_15/0.45)]`}>
      <div className={`relative h-40 ${ok ? "bg-[radial-gradient(120px_80px_at_30%_30%,#f6d365,transparent),radial-gradient(160px_100px_at_80%_80%,#fda085,transparent),#f3e3c3]" : "bg-[radial-gradient(140px_100px_at_50%_40%,#9ad0ff,transparent),radial-gradient(120px_120px_at_20%_90%,#c3b1ff,transparent),#dfe9ff]"}`}>
        {ok ? (
          <svg viewBox="0 0 250 160" className="absolute inset-0 h-full w-full">
            <path d="M20 120c30-50 60-60 90-30s50 20 70-20 40-40 60-30" fill="none" stroke="#16150f" strokeWidth="6" strokeLinecap="round" />
            <circle cx="70" cy="60" r="14" fill="#c8323a" />
          </svg>
        ) : (
          <svg viewBox="0 0 250 160" className="absolute inset-0 h-full w-full">
            <ellipse cx="125" cy="80" rx="60" ry="50" fill="#fff" opacity="0.9" />
            <path d="M95 70h60M100 95c10 10 40 10 50 0" stroke="#7a86a8" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M150 115l12 18M160 112l16 8M140 118l2 22" stroke="#7a86a8" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        <span className={`stamp absolute right-3 top-3 ${ok ? "stamp-green" : "stamp-rose"}`}>{verdict}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-bold">{name}</div>
          <div className="text-xs text-muted">{sub}</div>
        </div>
        <span className={`pill ${ok ? "pill-green" : "pill-rose"}`}>{ok ? "deploy" : "rejected"}</span>
      </div>
    </div>
  );
}
