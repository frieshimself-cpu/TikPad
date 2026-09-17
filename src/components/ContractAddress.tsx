"use client";

import { useState } from "react";
import { TIKPAD_CA, TIKPAD_PUMP_URL } from "@/lib/economics";

export function ContractAddress({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(TIKPAD_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  }

  if (compact) {
    return (
      <button onClick={copy} className="num flex w-full items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-2 text-left text-[11px] text-muted hover:border-line-strong hover:text-fg" title="Copy contract address">
        <span className="shrink-0 font-bold text-dim">CA</span>
        <span className="min-w-0 flex-1 truncate">{TIKPAD_CA}</span>
        <span className="shrink-0 font-semibold">{copied ? "✓" : "copy"}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card/80 p-2 pl-4 shadow-[0_12px_32px_-20px_rgba(19,18,16,0.3)] backdrop-blur sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 py-2 sm:py-0">
        <div className="text-[11px] font-bold uppercase tracking-widest text-dim">$TIKPAD contract</div>
        <div className="num mt-0.5 select-all break-all text-sm font-semibold">{TIKPAD_CA}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="btn btn-ghost h-10">{copied ? "Copied ✓" : "Copy"}</button>
        <a href={TIKPAD_PUMP_URL} target="_blank" rel="noreferrer" className="btn btn-primary h-10">Buy on pump.fun</a>
      </div>
    </div>
  );
}
