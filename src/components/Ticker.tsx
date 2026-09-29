import { HUSHPAY_CA, HUSHPAY_PUMP_URL } from "@/lib/economics";

/** Slim announcement bar. */
export function Ticker() {
  return (
    <a
      href={HUSHPAY_PUMP_URL}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-3 border-b border-line bg-fg px-4 py-2 text-xs font-medium text-white hover:bg-[#272c30]"
    >
      <span className="rounded-full bg-white px-2 py-0.5 text-fg text-[10px] font-bold uppercase tracking-wide">Live</span>
      <span>$HUSHPAY is on pump.fun</span>
      <span className="mono hidden truncate text-white/60 sm:inline">{HUSHPAY_CA}</span>
      <span aria-hidden>→</span>
    </a>
  );
}
