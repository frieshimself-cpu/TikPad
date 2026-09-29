import { ADPAD_CA, ADPAD_PUMP_URL } from "@/lib/economics";

/** Slim announcement bar. */
export function Ticker() {
  return (
    <a
      href={ADPAD_PUMP_URL}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-3 border-b border-line border-b border-line bg-[#12121a] px-4 py-2 text-xs font-medium text-muted hover:text-fg"
    >
      <span className="rounded-full bg-cyan px-2 py-0.5 text-[#0a0a0f] text-[10px] font-bold uppercase tracking-wide">Live</span>
      <span>$ADPAD is live on pump.fun</span>
      <span className="mono hidden truncate text-dim sm:inline">{ADPAD_CA}</span>
      <span aria-hidden>→</span>
    </a>
  );
}
