import Link from "next/link";
import { fmtUsd } from "@/lib/format";
import { feeTag } from "@/lib/handle";
import { MILESTONES_CENTS, MILESTONE_STEP_CENTS } from "@/lib/economics";

export const metadata = { title: "Docs — FansPad" };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How FansPad works</h1>
      <p className="mt-3 text-muted">
        FansPad turns pump.fun creator fees into payouts for OnlyFans creators. The creator does not need an account, a wallet, or to know the
        token exists. Their share accrues under their handle until they sign in to collect it.
      </p>

      <Section title="1. Launching">
        <p>
          You fill in a name, ticker, image and the OnlyFans handle that should be paid, then send one payment (dev buy + a small network reserve)
          to the FansPad treasury. The treasury creates the token on pump.fun, buys your dev allocation, and transfers those tokens to your wallet.
        </p>
        <p>
          The treasury is the token&apos;s on-chain <em>creator</em>. On pump.fun the creator is who receives creator fees, so every fee the token
          generates lands in the treasury with no further setup. The token description carries a visible tag so anyone can verify the routing:
        </p>
        <pre className="num overflow-x-auto rounded-xl border border-line bg-elev p-3 text-sm text-fg">{feeTag("handle")}</pre>
      </Section>

      <Section title="2. Attribution">
        <p>
          pump.fun pools creator fees per creator wallet, not per token, so FansPad tracks trades on every registered token. When the fee router
          claims fees, the claimed amount is split across tokens in proportion to their traded volume since the last claim, and each token&apos;s
          share is credited to its OnlyFans handle.
        </p>
      </Section>

      <Section title="3. The split">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>80%</strong> credited to the OnlyFans creator, valued in USD at the time of the claim.</li>
          <li><strong>20%</strong> kept by FansPad to run the router and cover payouts.</li>
        </ul>
      </Section>

      <Section title="4. Payouts">
        <p>A creator&apos;s share builds until lifetime earnings cross a milestone, then the unpaid balance is sent in SOL to the wallet they linked. Milestones:</p>
        <p className="num text-sm">{MILESTONES_CENTS.map(fmtUsd).join(" → ")} → every {fmtUsd(MILESTONE_STEP_CENTS)} after that</p>
        <p>
          To collect, a creator proves ownership on the <Link href="/claim" className="underline">claim page</Link>. OnlyFans has no public login, so
          verification works by placing a one-time code in the profile bio, which FansPad checks. They then link any Solana address.
        </p>
      </Section>

      <Section title="About this preview">
        <p>
          This deployment is the front end only. Launches, verification, fee claims and payouts are simulated in your browser so you can see the
          whole flow. Creator handles shown in the preview are fictional. The on-chain launch and fee router live in the repository&apos;s{" "}
          <span className="num">backend/</span> folder and are not connected yet.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}
