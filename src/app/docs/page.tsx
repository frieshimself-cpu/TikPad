import Link from "next/link";
import { BRAND, MAX_IMAGE_BYTES } from "@/lib/brand";

export const metadata = { title: `how it works — ${BRAND}` };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-5xl sm:text-6xl">how {BRAND} works</h1>
      <p className="mt-4 text-xl text-muted">
        {BRAND} is a pump.fun launchpad with one rule: a human has to have made the coin&apos;s picture. everything else is exactly what you&apos;d do on
        pump.fun, from your own wallet.
      </p>

      <Section title="1. launching" tilt="tilt-l">
        <p>
          you fill in a name, ticker, description, links, a picture and a dev buy amount. {BRAND} uploads the metadata and asks PumpPortal for a pump.fun
          creation transaction for <em>your</em> wallet. you sign it, your wallet pays for it, and your wallet is the coin&apos;s on-chain creator.{" "}
          {BRAND} never holds funds, never holds your coin, and takes no cut of creator rewards.
        </p>
        <p>the dev buy happens inside the same transaction and the tokens land in your wallet. 0 is fine.</p>
      </Section>

      <Section title="2. the picture check" tilt="tilt-r">
        <p>every picture goes through up to three detectors before anything gets uploaded or built:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>file provenance.</strong> the file&apos;s own metadata: C2PA content credentials and IPTC tags that mark AI output
            (&quot;trainedAlgorithmicMedia&quot;), stable diffusion parameters, ComfyUI workflows, and credits from midjourney, DALL·E, firefly, imagen, flux and
            friends. exact when it&apos;s there, easy to strip, so it&apos;s never the only check.
          </li>
          <li>
            <strong>claude vision.</strong> claude actually looks at the picture and decides if it was generated, with a confidence and plain reasons you get to
            see.
          </li>
          <li>
            <strong>sightengine.</strong> a classifier built just for spotting AI images, when the operator has it set up.
          </li>
        </ul>
        <p>
          each detector gives a probability that the picture is AI. if any of them hits the block line (50% by default), the launch is refused. a detector that
          is set up but down makes the check fail instead of waving the picture through.
        </p>
        <p>you see the verdict the moment you pick a picture, before signing anything. the same check runs again on the server when you deploy.</p>
      </Section>

      <Section title="3. what counts as AI" tilt="tilt-l">
        <p>
          pictures made by a text-to-image or image-to-image model, or where AI inpainting/outpainting makes up most of the picture. AI-upscaled copies of an
          AI picture still count.
        </p>
        <p>
          photos you took, stuff you drew or painted (in paint, on paper, in procreate, whatever), 3D you built, pixel art, logos, memes and screenshots you
          put together are human-made. small touch-ups like background removal, cropping, filters or upscaling don&apos;t make a picture AI.
        </p>
        <p>
          detection isn&apos;t perfect either way. if your real picture gets refused, try the original file (not something re-saved through an AI tool) or a
          different one. pictures must be PNG, JPEG, GIF or WebP under {Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.
        </p>
      </Section>

      <Section title="4. costs" tilt="tilt-r">
        <p>
          you pay the pump.fun creation rent, network fees and PumpPortal&apos;s fee inside the creation transaction, plus your dev buy. {BRAND} adds nothing.
          the picture check is paid for by whoever runs the site.
        </p>
      </Section>

      <Section title="5. running it yourself" tilt="tilt-l">
        <p>
          the code is open. set <span className="mono">ANTHROPIC_API_KEY</span> (and optionally sightengine keys) to turn on the gate. without a detector the
          launchpad refuses to deploy anything. a turso database is optional and only used to list launched coins.
        </p>
        <p>
          <Link href="/launch" className="btn btn-primary mt-2">launch a coin →</Link>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, tilt, children }: { title: string; tilt: string; children: React.ReactNode }) {
  return (
    <section className={`card mt-10 p-6 sm:p-8 ${tilt}`}>
      <h2 className="text-3xl">{title}</h2>
      <div className="mt-3 space-y-3 text-lg leading-relaxed text-muted">{children}</div>
    </section>
  );
}
