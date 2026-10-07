"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { BRAND, TOKEN_PUMP_URL, TOKEN_SYMBOL } from "@/lib/brand";

const LINKS = [
  ["/launch", "Launch"],
  ["/docs", "How it works"],
] as const;

export function TopNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label={`${BRAND} home`}><Logo /></Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${path.startsWith(href) ? "bg-fg text-bg" : "text-muted hover:bg-elev hover:text-fg"}`}
            >
              {label}
            </Link>
          ))}
          <a href={TOKEN_PUMP_URL} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-elev hover:text-fg">
            ${TOKEN_SYMBOL} ↗
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/launch" className="btn btn-primary h-10 sm:hidden">Launch</Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
