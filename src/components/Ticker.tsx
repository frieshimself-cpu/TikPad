import { TIKPAD_CA, TIKPAD_PUMP_URL } from "@/lib/economics";

/** Thin scrolling strip across the top of every page. */
export function Ticker() {
  const item = (
    <span className="num inline-flex items-center gap-6 px-6 text-xs font-semibold uppercase tracking-widest">
      <span>$TIKPAD is live on pump.fun</span>
      <span className="text-[#d9f99d]">CA {TIKPAD_CA}</span>
      <span>80% of creator fees to TikTok creators</span>
      <span className="text-[#d9f99d]">Paid at $5 · $10 · $20 · $50 · $100</span>
    </span>
  );
  return (
    <a href={TIKPAD_PUMP_URL} target="_blank" rel="noreferrer" className="block overflow-hidden border-b border-fg bg-fg py-2 text-bg" aria-label="TikPad token on pump.fun">
      <div className="ticker flex w-max">
        {item}
        {item}
        {item}
      </div>
    </a>
  );
}
