import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Logo size={18} />
          <p className="max-w-md text-dim">
            Token creator fees, routed to TikTok creators. Built on pump.fun and Solana. Not affiliated with TikTok or pump.fun.
          </p>
        </div>
        <nav className="flex gap-6">
          <Link href="/launch" className="hover:text-fg">Launch</Link>
          <Link href="/claim" className="hover:text-fg">Claim</Link>
          <Link href="/docs" className="hover:text-fg">Docs</Link>
          <a href="https://github.com/frieshimself-cpu/TikPad" className="hover:text-fg" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
