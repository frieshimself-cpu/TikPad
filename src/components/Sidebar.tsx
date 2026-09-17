"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { ContractAddress } from "./ContractAddress";
import { TIKPAD_PUMP_URL } from "@/lib/economics";

const LINKS = [
  ["/", "Home", "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  ["/launch", "Launch", "M5 19 19 5M9 5h10v10"],
  ["/claim", "Creators", "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-8 9a6 6 0 0 1 8 0"],
  ["/docs", "Docs", "M6 4h9l4 4v12H6zM14 4v5h5"],
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col bg-card lg:flex lg:border-r lg:border-line">
        <div className="px-6 pb-4 pt-6">
          <Link href="/" aria-label="TikPad home"><Logo size={26} /></Link>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {LINKS.map(([href, label, d]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-fg text-white shadow-md" : "text-muted hover:bg-elev hover:text-fg"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={d} />
                </svg>
                {label}
              </Link>
            );
          })}
        </nav>
        <a
          href={TIKPAD_PUMP_URL}
          target="_blank"
          rel="noreferrer"
          className="lift mx-3 mt-4 rounded-xl border border-line bg-[linear-gradient(135deg,#ede9fe,#d9f99d)] p-4"
        >
          <div className="text-[11px] font-bold uppercase tracking-widest text-cyan">Token</div>
          <div className="num mt-1 text-lg font-bold">$TIKPAD</div>
          <div className="mt-1 text-xs text-muted">Trade on pump.fun ↗</div>
        </a>
        <div className="mt-auto space-y-3 px-4 pb-5">
          <ContractAddress compact />
          <WalletButton />
          <Link href="/launch" className="btn btn-primary w-full">Launch a token</Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-card/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="TikPad home"><Logo /></Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-muted">
          {LINKS.slice(1).map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-fg">{label}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}
