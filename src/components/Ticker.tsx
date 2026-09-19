import { FANSPAD_CA, FANSPAD_PUMP_URL } from "@/lib/economics";

/** Slim announcement bar. */
export function Ticker() {
  return (
    <a
      href={FANSPAD_PUMP_URL}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-3 border-b border-line bg-[#e6f6fd] px-4 py-2 text-xs font-medium text-[#0096d6] hover:bg-[#d8f1fc]"
    >
      <span className="rounded-full bg-cyan px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Live</span>
      <span>$FANSPAD is on pump.fun</span>
      <span className="mono hidden truncate text-[#0096d6]/70 sm:inline">{FANSPAD_CA}</span>
      <span aria-hidden>→</span>
    </a>
  );
}
