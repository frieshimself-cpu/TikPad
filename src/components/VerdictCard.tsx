import { DETECTOR_LABEL, type ImageVerdict } from "@/lib/verdict";

/** The gate's decision, shown to the launcher. */
export function VerdictCard({ verdict, compact = false }: { verdict: ImageVerdict; compact?: boolean }) {
  const pct = Math.round(verdict.aiProbability * 100);
  return (
    <div className={`card p-5 ${verdict.allowed ? "bg-green-soft" : "bg-rose-soft"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`font-display text-lg ${verdict.allowed ? "text-green" : "text-rose"}`}>
            {verdict.allowed ? (verdict.verdict === "unclear" ? "passed, with some doubt" : "passed: looks human-made") : "NOPE: looks AI-generated"}
          </div>
          <p className="mt-1 text-muted">{verdict.summary}</p>
        </div>
        <span className={`stamp shrink-0 ${verdict.allowed ? "stamp-green" : "stamp-rose"}`}>{verdict.allowed ? "human-made" : "AI"}</span>
      </div>
      {!compact && (
        <ul className="mt-4 space-y-3 border-t-[2px] border-dashed border-line pt-3 text-sm text-muted">
          {verdict.signals.map((s) => (
            <li key={s.source}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-fg">{DETECTOR_LABEL[s.source]}</span>
                <span className="num font-display">{Math.round(s.aiProbability * 100)}% AI</span>
              </div>
              <div>{s.summary}</div>
              {s.details.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {s.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          <li className="num pt-1 text-dim">
            highest AI probability {pct}% · blocks at {Math.round(verdict.threshold * 100)}%
          </li>
        </ul>
      )}
    </div>
  );
}
