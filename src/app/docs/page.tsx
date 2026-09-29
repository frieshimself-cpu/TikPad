import Link from "next/link";
import { AD_BUDGET_BPS, CAMPAIGN_TYPES, CLAIM_INTERVAL_MS } from "@/lib/economics";
import { feeTag } from "@/lib/handle";

export const metadata = { title: "How it works — AdPad" };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-4xl font-extrabold sm:text-5xl">How AdPad works</h1>
      <p className="mt-3 text-muted">
        AdPad is a pump.fun launchpad where a coin&apos;s creator rewards pay for its own advertising. Volume funds marketing; nobody has to
        trust a dev wallet to spend it.
      </p>

      <Section title="1. Launching">
        <p>
          You fill in name, ticker, image, links, optionally the coin&apos;s X account, and a dev buy. You pay dev buy + a small creation reserve
          to the AdPad treasury in one transaction. The treasury creates the coin on pump.fun, buys your dev allocation, and sends those tokens to
          your wallet.
        </p>
        <p>
          The treasury is the coin&apos;s on-chain <em>creator</em>. On pump.fun the creator receives creator rewards, so every reward the coin
          earns lands with AdPad without further setup. The description carries a visible tag:
        </p>
        <pre className="mono overflow-x-auto rounded-xl border border-line bg-elev p-3 text-sm text-fg">{feeTag()}</pre>
      </Section>

      <Section title="2. Rewards become budget">
        <p>
          The treasury claims creator rewards every {CLAIM_INTERVAL_MS / 60000} minutes. Rewards are attributed to the coin that generated them
          and {AD_BUDGET_BPS / 100}% is credited to that coin&apos;s ad budget. The remaining {100 - AD_BUDGET_BPS / 100}% covers AdPad&apos;s
          claim fees, ad-account costs and operations.
        </p>
      </Section>

      <Section title="3. Campaigns">
        <p>Once a budget clears $20, AdPad spends it on the coin&apos;s behalf. Campaign types:</p>
        <ul className="list-disc space-y-1 pl-5">
          {CAMPAIGN_TYPES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>
          Every campaign, its spend and its results are listed on the <Link href="/campaigns" className="underline">campaigns page</Link> and on
          the coin&apos;s own page. Launchers don&apos;t manage anything; holders can see where every dollar went.
        </p>
      </Section>

      <Section title="What is live today">
        <p>
          Launching is live: coins are created on pump.fun with the AdPad treasury as creator, and the treasury claims rewards every two minutes.
          The campaign pages are a browser-side preview with fictional coins until the ad backend that books and reports campaigns is connected.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}
