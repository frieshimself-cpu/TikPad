import { FANSPAD_CA, FANSPAD_PUMP_URL } from "@/lib/economics";

/** Thin scrolling strip across the top of every page. */
export function Ticker() {
  const item = (
    <span className="num inline-flex items-center gap-8 px-8 text-[11px] font-semibold uppercase tracking-[0.18em]">
      <span>$FANSPAD is live on pump.fun</span>
      <span className="h-1 w-1 rounded-full bg-[#fbcfe8]" />
      <span className="text-[#fbcfe8]">CA {FANSPAD_CA}</span>
      <span className="h-1 w-1 rounded-full bg-[#fbcfe8]" />
      <span>80% of creator fees to OnlyFans creators</span>
      <span className="h-1 w-1 rounded-full bg-[#fbcfe8]" />
    </span>
  );
  return (
    <a href={FANSPAD_PUMP_URL} target="_blank" rel="noreferrer" className="block overflow-hidden bg-fg py-2 text-white" aria-label="FansPad token on pump.fun">
      <div className="ticker flex w-max">
        {item}
        {item}
        {item}
      </div>
    </a>
  );
}
