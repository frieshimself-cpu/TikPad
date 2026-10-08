import Link from "next/link";
import { ContractAddress } from "./ContractAddress";
import { Logo } from "./Logo";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t-[3px] border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-3">
        <div>
          <Logo size={56} />
          <p className="mt-3 text-muted">
            a pump.fun launchpad for coins with human-made pictures. logo drawn in paint in about 2 minutes, which is the point. not affiliated with pump.fun.
            launching coins is risky, this is not financial advice.
          </p>
        </div>
        <div>
          <div className="font-display text-lg">the {BRAND} coin</div>
          <div className="mt-2"><ContractAddress compact /></div>
        </div>
        <nav className="flex flex-col gap-1.5 text-muted">
          <div className="font-display text-lg text-fg">pages</div>
          <Link href="/launch" className="hover:scribble w-fit">launch a coin</Link>
          <Link href="/docs" className="hover:scribble w-fit">how it works</Link>
          <a href="https://github.com/frieshimself-cpu/TikPad" className="hover:scribble w-fit" target="_blank" rel="noreferrer">github</a>
        </nav>
      </div>
    </footer>
  );
}
