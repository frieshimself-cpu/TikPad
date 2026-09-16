import Link from "next/link";
import { ContractAddress } from "./ContractAddress";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-card">
      <div className="grid gap-8 px-6 py-10 text-sm sm:px-10 md:grid-cols-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-dim">TikPad</div>
          <p className="mt-2 text-muted">Token creator fees, routed to TikTok creators. Built on pump.fun and Solana. Not affiliated with TikTok or pump.fun.</p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-dim">Token</div>
          <div className="mt-2"><ContractAddress compact /></div>
        </div>
        <nav className="flex flex-col gap-1 text-muted">
          <div className="text-xs font-bold uppercase tracking-widest text-dim">Pages</div>
          <Link href="/launch" className="mt-1 hover:text-fg">Launch</Link>
          <Link href="/claim" className="hover:text-fg">Claim</Link>
          <Link href="/docs" className="hover:text-fg">Docs</Link>
          <a href="https://github.com/frieshimself-cpu/TikPad" className="hover:text-fg" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
