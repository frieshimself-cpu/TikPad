"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { ContractAddress } from "./ContractAddress";
import { ADPAD_PUMP_URL } from "@/lib/economics";

const LINKS = [
  ["/", "Home", "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  ["/launch", "Launch", "M12 19V5m0 0-6 6m6-6 6 6"],
  ["/campaigns", "Campaigns", "M4 19h16M6 16V9m6 7V5m6 11v-4"],
  ["/docs", "How it works", "M12 17h.01M12 13a2 2 0 1 0-2-2m2 11a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"],
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-card lg:flex">
        <div className="px-7 pb-6 pt-7">
          <Link href="/" aria-label="AdPad home"><Logo size={28} /></Link>
        </div>
        <nav className="flex flex-col gap-0.5 px-4">
          {LINKS.map(([href, label, d]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium transition ${
                  active ? "bg-elev font-semibold text-cyan" : "text-fg hover:bg-elev"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={d} />
                </svg>
                {label}
              </Link>
            );
          })}
          <a href={ADPAD_PUMP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium text-fg transition hover:bg-elev">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v10M9 10.5h4.5a1.75 1.75 0 0 1 0 3.5H10a1.75 1.75 0 0 0 0 3.5h5" />
            </svg>
            $ADPAD
          </a>
        </nav>
        <div className="px-4 pt-6">
          <Link href="/launch" className="btn btn-primary w-full">Launch a coin</Link>
        </div>
        <div className="mt-auto space-y-3 px-4 pb-6">
          <ContractAddress compact />
          <WalletButton />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-card/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="AdPad home"><Logo /></Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted">
          {LINKS.slice(1, 3).map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-fg">{label}</Link>
          ))}
          <Link href="/docs" className="hover:text-fg">Docs</Link>
        </nav>
      </header>
    </>
  );
}
