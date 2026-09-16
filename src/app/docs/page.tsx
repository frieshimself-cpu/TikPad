import Link from "next/link";
import { config, feeTag } from "@/lib/config";
import { treasuryAddress } from "@/lib/solana";
import { fmtUsd } from "@/lib/format";

export const metadata = { title: "Docs — TikPad" };
export const dynamic = "force-dynamic";

export default function DocsPage() {
  const treasury = treasuryAddress();
  const creatorPct = config.creatorShareBps / 100;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How TikPad works</h1>
      <p className="mt-3 text-muted">
        TikPad turns pump.fun creator fees into payouts for TikTok creators. The creator does not need an account, a wallet, or to know
        the token exists. Their share accrues under their handle until they sign in to collect it.
      </p>

      <Section title="1. Launching">
        <p>
          You fill in a name, ticker, image and the TikTok handle that should be paid, then send one payment (dev buy + a small network
          reserve) to the TikPad treasury. The treasury creates the token on pump.fun through PumpPortal, buys your dev allocation, and
          transfers those tokens to your wallet.
        </p>
        <p>
          The treasury is the token&apos;s on-chain <em>creator</em>. On pump.fun the creator is who receives creator fees, so every fee the
          token generates lands in the treasury with no further setup. The token description carries a visible tag so anyone can verify
          the routing:
        </p>
        <Code>{feeTag("handle")}</Code>
        <p className="text-sm text-dim">Treasury: <span className="num break-all">{treasury}</span></p>
      </Section>

      <Section title="2. Attribution">
        <p>
          pump.fun pools creator fees per creator wallet, not per token, so TikPad tracks trades on every registered token through the
          PumpPortal trade stream. When the fee router claims fees, the claimed amount is split across tokens in proportion to their traded
          volume since the last claim, and each token&apos;s share is credited to its TikTok handle.
        </p>
      </Section>

      <Section title="3. The split">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>{creatorPct}%</strong> credited to the TikTok creator, valued in USD at the time of the claim.
          </li>
          <li>
            <strong>{100 - creatorPct}%</strong> kept by TikPad to run the router and cover payouts.
          </li>
        </ul>
      </Section>

      <Section title="4. Payouts">
        <p>
          A creator&apos;s share builds until lifetime earnings cross a milestone, then the unpaid balance is sent in SOL to the wallet they
          linked. Milestones:
        </p>
        <p className="num text-sm">
          {config.milestonesCents.map(fmtUsd).join(" → ")} → every {fmtUsd(config.milestoneStepCents)} after that
        </p>
        <p>
          To collect, a creator signs in with TikTok (Login Kit) on the <Link href="/claim" className="underline">claim page</Link>. TikTok
          returns the verified username, which is matched against the handle on the token. They then link any Solana address.
        </p>
      </Section>

      <Section title="5. Running it yourself">
        <p>Everything lives in this repo. Three processes:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><span className="num">npm run dev</span> — the web app and API.</li>
          <li><span className="num">npm run worker</span> — the fee router: streams trades, claims creator fees, attributes, pays.</li>
          <li>A Solana RPC (public mainnet works; a dedicated one is better).</li>
        </ul>
        <p>
          Without <span className="num">TREASURY_SECRET_KEY</span> the app runs in demo mode: launches and payouts are simulated and flagged,
          nothing touches the chain. See <span className="num">.env.example</span>.
        </p>
      </Section>

      <Section title="Risks, plainly">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Attribution by traded volume is an estimate of what each token contributed, not an exact on-chain figure.</li>
          <li>The treasury is a hot wallet. Keep only what it needs.</li>
          <li>Creators can be paid for tokens they never endorsed. The tag in the description makes the routing visible, nothing more.</li>
        </ul>
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

function Code({ children }: { children: React.ReactNode }) {
  return <pre className="num overflow-x-auto rounded-xl border border-line bg-elev p-3 text-sm text-fg">{children}</pre>;
}
