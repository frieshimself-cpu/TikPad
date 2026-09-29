"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { ADPAD_PUMP_URL } from "@/lib/economics";

const LINKS = [
  ["/launch", "Launch"],
  ["/campaigns", "Campaigns"],
  ["/docs", "How it works"],
] as const;

export function TopNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="AdPad home"><Logo size={28} /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(([href, label]) => {
              const active = path.startsWith(href);
              return (
                <Link key={href} href={href} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-elev text-cyan" : "text-muted hover:text-fg"}`}>
                  {label}
                </Link>
              );
            })}
            <a href={ADPAD_PUMP_URL} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:text-fg">
              $ADPAD ↗
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><WalletButton /></div>
          <Link href="/launch" className="btn btn-primary h-10 px-5">Launch a coin</Link>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${path.startsWith(href) ? "bg-elev text-cyan" : "text-muted"}`}>{label}</Link>
        ))}
        <a href={ADPAD_PUMP_URL} target="_blank" rel="noreferrer" className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-muted">$ADPAD ↗</a>
      </nav>
    </header>
  );
}
