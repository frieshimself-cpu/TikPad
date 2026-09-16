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
      <button onClick={copy} className="num inline-flex items-center gap-2 text-xs text-muted hover:text-fg" title="Copy contract address">
        <span className="text-dim">CA</span>
        <span className="break-all text-left">{TIKPAD_CA}</span>
        <span className="text-dim">{copied ? "copied" : "copy"}</span>
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-dim">
          <span>$TIKPAD contract address</span>
          <span className="pill pill-green">pump.fun</span>
        </div>
        <div className="num mt-1 select-all break-all text-sm">{TIKPAD_CA}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="btn btn-ghost h-10">
          {copied ? "Copied" : "Copy"}
        </button>
        <a href={TIKPAD_PUMP_URL} target="_blank" rel="noreferrer" className="btn btn-primary h-10">
          Buy on pump.fun
        </a>
      </div>
    </div>
  );
}
