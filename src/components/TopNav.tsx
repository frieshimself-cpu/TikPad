"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { BRAND, TOKEN_PUMP_URL, TOKEN_SYMBOL } from "@/lib/brand";

const LINKS = [
  ["/launch", "launch a coin"],
  ["/docs", "how it works"],
] as const;

export function TopNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-line bg-white">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label={`${BRAND} home`}><Logo /></Link>
        <nav className="hidden items-center gap-2 sm:flex">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={`font-display rounded-md px-3 py-1 text-[1.05rem] transition ${path.startsWith(href) ? "highlight" : "hover:scribble"}`}>
              {label}
            </Link>
          ))}
          <a href={TOKEN_PUMP_URL} target="_blank" rel="noreferrer" className="font-display rounded-md px-3 py-1 text-[1.05rem] hover:scribble">
            ${TOKEN_SYMBOL} →
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/launch" className="btn btn-primary h-10 sm:hidden">launch</Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
