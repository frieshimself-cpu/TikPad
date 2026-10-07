import { DETECTOR_LABEL, type ImageVerdict } from "@/lib/verdict";

/** The gate's decision, shown to the launcher. */
export function VerdictCard({ verdict, compact = false }: { verdict: ImageVerdict; compact?: boolean }) {
  const pct = Math.round(verdict.aiProbability * 100);
  return (
    <div className={`rounded-2xl border p-4 ${verdict.allowed ? "border-[#bfe0cb] bg-green-soft" : "border-[#f1c2c2] bg-rose-soft"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`text-sm font-bold ${verdict.allowed ? "text-green" : "text-rose"}`}>
            {verdict.allowed ? (verdict.verdict === "unclear" ? "Passed, with some doubt" : "Passed: looks human-made") : "Blocked: looks AI-generated"}
          </div>
          <p className="mt-1 text-sm text-muted">{verdict.summary}</p>
        </div>
        <span className={`stamp shrink-0 ${verdict.allowed ? "stamp-green" : "stamp-rose"}`}>{verdict.allowed ? "Human-made" : "AI detected"}</span>
      </div>
      {!compact && (
        <ul className="mt-3 space-y-2 border-t border-black/5 pt-3 text-xs text-muted">
          {verdict.signals.map((s) => (
            <li key={s.source}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-fg">{DETECTOR_LABEL[s.source]}</span>
                <span className="num">{Math.round(s.aiProbability * 100)}% AI</span>
              </div>
              <div>{s.summary}</div>
              {s.details.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {s.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          <li className="num pt-1 text-dim">
            Highest AI probability {pct}% · blocks at {Math.round(verdict.threshold * 100)}%
          </li>
        </ul>
      )}
    </div>
  );
}
