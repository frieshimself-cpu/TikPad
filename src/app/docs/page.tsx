import Link from "next/link";
import { BRAND, MAX_IMAGE_BYTES } from "@/lib/brand";

export const metadata = { title: `How it works — ${BRAND}` };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-4xl sm:text-5xl">How {BRAND} works</h1>
      <p className="mt-3 text-muted">
        {BRAND} is a pump.fun launchpad with one rule: the coin&apos;s image must be made by a human. Everything else is exactly what you would do on
        pump.fun, from your own wallet.
      </p>

      <Section title="1. Launching">
        <p>
          You fill in a name, ticker, description, links, an image and a dev buy amount. {BRAND} uploads the metadata and asks PumpPortal for a
          pump.fun creation transaction for <em>your</em> wallet. You sign it, your wallet pays for it, and your wallet is the coin&apos;s on-chain
          creator. {BRAND} never custodies funds, never holds your coin, and takes no share of creator rewards.
        </p>
        <p>The dev buy is executed inside the same creation transaction and the tokens land in your wallet. Setting it to 0 is fine.</p>
      </Section>

      <Section title="2. The image check">
        <p>Every image goes through up to three detectors before anything is uploaded or built:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>File provenance.</strong> The file&apos;s own metadata: C2PA Content Credentials and IPTC tags that mark AI output
            (&quot;trainedAlgorithmicMedia&quot;), Stable Diffusion generation parameters, ComfyUI workflows, and generator credits from Midjourney,
            DALL·E, Firefly, Imagen, FLUX and others. Exact when present, easy to strip, so it is never the only check.
          </li>
          <li>
            <strong>Claude vision.</strong> Claude looks at the picture itself and judges whether it was generated, with a confidence and plain-language
            reasons that are shown to you.
          </li>
          <li>
            <strong>Sightengine.</strong> A dedicated AI-generated-image classifier, used when the operator has configured it.
          </li>
        </ul>
        <p>
          Each detector produces a probability that the image is AI-generated. If any of them reaches the block threshold (50% by default), the launch is
          refused. A detector that is configured but unavailable makes the check fail rather than wave the image through.
        </p>
        <p>You see the verdict the moment you pick an image, before you connect a wallet or sign anything, and the same verdict is enforced again on the server when you deploy.</p>
      </Section>

      <Section title="3. What counts as AI-generated">
        <p>
          Pictures produced by a text-to-image or image-to-image model, or where AI inpainting or outpainting makes up most of the picture. AI-upscaled
          copies of an AI image still count.
        </p>
        <p>
          Photos you took, art you drew or painted, 3D you built, pixel art, logos, typographic designs, memes and screenshots you assembled by hand are
          human-made. Light touch-ups like background removal, cropping, filters or upscaling do not make an image AI-generated.
        </p>
        <p>
          Detection is not perfect in either direction. If a human-made image is refused, try a different export of it (the original file, not a
          re-save through an AI tool) or a different piece. Images must be PNG, JPEG, GIF or WebP under {Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.
        </p>
      </Section>

      <Section title="4. Costs">
        <p>
          You pay the pump.fun creation rent, network fees and PumpPortal&apos;s fee in the creation transaction, plus your dev buy. {BRAND} adds no fee.
          The image check is paid for by the operator.
        </p>
      </Section>

      <Section title="5. Running it yourself">
        <p>
          The code is open. Set <span className="mono">ANTHROPIC_API_KEY</span> (and optionally Sightengine keys) to enable the gate; without a detector the
          launchpad refuses to deploy anything. A Turso database is optional and only used to list launched coins.
        </p>
        <p>
          <Link href="/launch" className="underline">Launch a coin →</Link>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}
