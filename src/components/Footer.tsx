import Link from "next/link";
import { ContractAddress } from "./ContractAddress";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:px-8 md:grid-cols-3">
        <div>
          <div className="font-bold">{BRAND}</div>
          <p className="mt-2 text-muted">A pump.fun launchpad for coins with human-made images. Not affiliated with pump.fun. Launching coins is risky; nothing here is financial advice.</p>
        </div>
        <div>
          <div className="font-bold">Token</div>
          <div className="mt-2"><ContractAddress compact /></div>
        </div>
        <nav className="flex flex-col gap-1.5 text-muted">
          <div className="font-bold text-fg">Pages</div>
          <Link href="/launch" className="hover:text-fg">Launch</Link>
          <Link href="/docs" className="hover:text-fg">How it works</Link>
          <a href="https://github.com/frieshimself-cpu/TikPad" className="hover:text-fg" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
