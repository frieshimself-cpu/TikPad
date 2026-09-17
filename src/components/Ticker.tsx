import { TIKPAD_CA, TIKPAD_PUMP_URL } from "@/lib/economics";

/** Thin scrolling strip across the top of every page. */
export function Ticker() {
  const item = (
    <span className="num inline-flex items-center gap-8 px-8 text-[11px] font-semibold uppercase tracking-[0.18em]">
      <span>$TIKPAD is live on pump.fun</span>
      <span className="h-1 w-1 rounded-full bg-[#d9f99d]" />
      <span className="text-[#d9f99d]">CA {TIKPAD_CA}</span>
      <span className="h-1 w-1 rounded-full bg-[#d9f99d]" />
      <span>80% of creator fees to TikTok creators</span>
      <span className="h-1 w-1 rounded-full bg-[#d9f99d]" />
    </span>
  );
  return (
    <a href={TIKPAD_PUMP_URL} target="_blank" rel="noreferrer" className="block overflow-hidden bg-fg py-2 text-white" aria-label="TikPad token on pump.fun">
      <div className="ticker flex w-max">
        {item}
        {item}
        {item}
      </div>
    </a>
  );
}
