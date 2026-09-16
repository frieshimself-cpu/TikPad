import Link from "next/link";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="TikPad home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <Link href="/launch" className="hover:text-fg">Launch</Link>
            <Link href="/claim" className="hover:text-fg">Creators</Link>
            <Link href="/docs" className="hover:text-fg">Docs</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="pill pill-amber hidden sm:inline-flex" title="Front-end preview: launches and payouts are simulated in your browser.">
            Preview
          </span>
          <Link href="/launch" className="btn btn-primary hidden h-10 sm:inline-flex">
            Launch a token
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
