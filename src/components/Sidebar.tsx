"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";

const LINKS = [
  ["/", "Home", "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  ["/launch", "Launch", "M12 19V5m0 0-6 6m6-6 6 6"],
  ["/claim", "Creators", "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-8 9a6 6 0 0 1 8 0"],
  ["/docs", "How it works", "M12 17h.01M12 13a2 2 0 1 0-2-2m2 11a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"],
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-card lg:flex">
        <div className="px-7 pb-6 pt-7">
          <Link href="/" aria-label="FansPad home"><Logo size={28} /></Link>
        </div>
        <nav className="flex flex-col gap-0.5 px-4">
          {LINKS.map(([href, label, d]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium transition ${
                  active ? "bg-[#e6f6fd] font-semibold text-[#0096d6]" : "text-fg hover:bg-elev"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={d} />
                </svg>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pt-6">
          <Link href="/launch" className="btn btn-primary w-full">Launch a token</Link>
        </div>
        <div className="mt-auto space-y-3 px-4 pb-6">
          <WalletButton />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-card/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="FansPad home"><Logo /></Link>
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
