"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { ContractAddress } from "./ContractAddress";
import { TIKPAD_PUMP_URL } from "@/lib/economics";

const LINKS = [
  ["/", "Home"],
  ["/launch", "Launch"],
  ["/claim", "Creators"],
  ["/docs", "Docs"],
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-card lg:flex">
        <div className="border-b border-line p-6">
          <Link href="/" aria-label="TikPad home"><Logo size={26} /></Link>
        </div>
        <nav className="flex flex-col p-3">
          {LINKS.map(([href, label]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                  active ? "bg-fg text-bg" : "text-muted hover:bg-elev hover:text-fg"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <a href={TIKPAD_PUMP_URL} target="_blank" rel="noreferrer" className="num mt-2 rounded-md px-3 py-2.5 text-sm font-semibold text-cyan hover:bg-elev">
            $TIKPAD ↗
          </a>
        </nav>
        <div className="mt-auto space-y-4 border-t border-line p-4">
          <span className="pill pill-amber">Preview</span>
          <ContractAddress compact />
          <WalletButton />
          <Link href="/launch" className="btn btn-primary w-full">Launch a token</Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-card px-4 lg:hidden">
        <Link href="/" aria-label="TikPad home"><Logo /></Link>
        <nav className="flex items-center gap-4 text-sm font-semibold uppercase tracking-wide text-muted">
          {LINKS.slice(1).map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-fg">{label}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}
