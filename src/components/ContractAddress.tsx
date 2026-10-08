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
      <button onClick={copy} className="mono wobbly-2 flex w-full items-center gap-2 border-[3px] border-line bg-white px-3 py-2.5 text-left text-[11px] text-muted shadow-[3px_3px_0_#111] hover:bg-elev" title="Copy contract address">
        <span className="font-display shrink-0 text-sm">CA</span>
        <span className="min-w-0 flex-1 truncate">{TOKEN_CA}</span>
        <span className="font-display shrink-0 text-sm text-green">{copied ? "copied!" : "copy"}</span>
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-2 pl-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 py-2 sm:py-0">
        <div className="font-display text-sm">${TOKEN_SYMBOL} contract address</div>
        <div className="mono mt-0.5 select-all break-all text-sm">{TOKEN_CA}</div>
      </div>
      <div className="flex gap-3">
        <button onClick={copy} className="btn btn-ghost h-11">{copied ? "copied!" : "copy"}</button>
        <a href={TOKEN_PUMP_URL} target="_blank" rel="noreferrer" className="btn btn-primary h-11">buy on pump.fun</a>
      </div>
    </div>
  );
}
