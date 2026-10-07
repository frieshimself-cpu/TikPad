"use client";

import { useState } from "react";
import { TOKEN_CA, TOKEN_PUMP_URL, TOKEN_SYMBOL } from "@/lib/brand";

export function ContractAddress({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(TOKEN_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  }

  if (compact) {
    return (
      <button onClick={copy} className="mono flex w-full items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-left text-[11px] text-muted hover:text-fg" title="Copy contract address">
        <span className="shrink-0 font-semibold text-dim">CA</span>
        <span className="min-w-0 flex-1 truncate">{TOKEN_CA}</span>
        <span className="shrink-0 font-semibold text-green">{copied ? "✓" : "copy"}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-2 pl-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 py-2 sm:py-0">
        <div className="text-xs font-medium text-muted">${TOKEN_SYMBOL} contract</div>
        <div className="mono mt-0.5 select-all break-all text-sm font-medium">{TOKEN_CA}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="btn btn-ghost h-10">{copied ? "Copied" : "Copy"}</button>
        <a href={TOKEN_PUMP_URL} target="_blank" rel="noreferrer" className="btn btn-primary h-10">Buy on pump.fun</a>
      </div>
    </div>
  );
}
