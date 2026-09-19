"use client";

import { useState } from "react";
import { FANSPAD_CA, FANSPAD_PUMP_URL } from "@/lib/economics";

export function ContractAddress({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(FANSPAD_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  }

  if (compact) {
    return (
      <button onClick={copy} className="mono flex w-full items-center gap-2 rounded-xl bg-elev px-3 py-2.5 text-left text-[11px] text-muted hover:text-fg" title="Copy contract address">
        <span className="shrink-0 font-semibold text-dim">CA</span>
        <span className="min-w-0 flex-1 truncate">{FANSPAD_CA}</span>
        <span className="shrink-0 font-semibold text-cyan">{copied ? "✓" : "copy"}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-2 pl-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 py-2 sm:py-0">
        <div className="text-xs font-medium text-muted">$FANSPAD contract</div>
        <div className="mono mt-0.5 select-all break-all text-sm font-medium">{FANSPAD_CA}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="btn btn-ghost h-10">{copied ? "Copied" : "Copy"}</button>
        <a href={FANSPAD_PUMP_URL} target="_blank" rel="noreferrer" className="btn btn-primary h-10">Buy on pump.fun</a>
      </div>
    </div>
  );
}
