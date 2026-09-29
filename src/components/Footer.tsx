import Link from "next/link";
import { Logo } from "./Logo";
import { ContractAddress } from "./ContractAddress";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 text-sm sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-muted">Coins that buy their own ads. Built on pump.fun and Solana. Not affiliated with X or pump.fun.</p>
          <div className="mt-4 max-w-sm"><ContractAddress compact /></div>
        </div>
        <nav className="flex flex-col gap-2 text-muted">
          <div className="font-bold text-fg">Product</div>
          <Link href="/launch" className="hover:text-cyan">Launch a coin</Link>
          <Link href="/campaigns" className="hover:text-cyan">Campaigns</Link>
          <Link href="/docs" className="hover:text-cyan">How it works</Link>
        </nav>
        <nav className="flex flex-col gap-2 text-muted">
          <div className="font-bold text-fg">Links</div>
          <a href="https://github.com/frieshimself-cpu/TikPad" className="hover:text-cyan" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://pump.fun" className="hover:text-cyan" target="_blank" rel="noreferrer">pump.fun</a>
        </nav>
      </div>
    </footer>
  );
}
