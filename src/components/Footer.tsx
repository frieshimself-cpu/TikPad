import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm sm:px-12 md:grid-cols-[1fr_auto]">
        <div>
          <div className="font-bold">FansPad</div>
          <p className="mt-2 text-muted">Token creator fees, routed to OnlyFans creators. Built on pump.fun and Solana. Not affiliated with OnlyFans or pump.fun.</p>
        </div>
        <nav className="flex flex-col gap-1.5 text-muted">
          <div className="font-bold text-fg">Pages</div>
          <Link href="/launch" className="hover:text-cyan">Launch</Link>
          <Link href="/claim" className="hover:text-cyan">Claim</Link>
          <Link href="/docs" className="hover:text-cyan">How it works</Link>
          <a href="https://github.com/frieshimself-cpu/TikPad" className="hover:text-cyan" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
