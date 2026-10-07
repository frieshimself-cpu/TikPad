"use client";

import Link from "next/link";
import { HeroArt } from "./HeroArt";
import { ContractAddress } from "./ContractAddress";
import { RecentLaunches, useLaunches } from "./RecentLaunches";
import { BRAND } from "@/lib/brand";

const STEPS = [
  ["Fill in the coin", "Name, ticker, image, links and how much SOL you want to dev buy. Same fields as pump.fun."],
  ["The image is checked", `${BRAND} reads the file's provenance data and runs AI-image detectors on the picture. Takes a few seconds.`],
  ["Deploy from your wallet", "If it passes, you sign one transaction. You are the coin's creator on pump.fun and keep every creator reward. If it fails, it never deploys."],
];

const RULES = [
  ["Blocked", "Midjourney, DALL·E, Stable Diffusion, FLUX, Imagen, Firefly and friends. AI-upscaled copies of an AI image. Anything the detectors call AI-generated."],
  ["Allowed", "Photos you took, art you drew or painted, 3D you built, pixel art, logos, memes and screenshots you made. Light touch-ups like background removal are fine."],
];

export function HomeView() {
  const data = useLaunches();
  const launched = data?.tokens.length ?? null;
  const blocked = data?.gate.blocked ?? null;
  const checked = data?.gate.checked ?? null;

  return (
    <div>
      <section className="px-5 pb-16 pt-14 sm:px-8 lg:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="pill pill-ink">pump.fun launchpad</span>
            <h1 className="mt-6 max-w-2xl text-5xl sm:text-7xl">
              Launch a coin. <span className="italic">Not a slop coin.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Pick a name, an image and a dev buy, deploy to pump.fun from your own wallet. One rule: the image has to be made by a human.
              If it&apos;s AI-generated, {BRAND} won&apos;t let it deploy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-primary h-12 px-7 text-base">Launch a coin</Link>
              <Link href="/docs" className="btn btn-ghost h-12 px-7 text-base">How the check works</Link>
            </div>
            <div className="mt-10 max-w-xl">
              <ContractAddress />
            </div>
          </div>
          <div className="hidden lg:block">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-3">
          {[
            ["Deployed", launched, "human-made coins"],
            ["Checked", checked, "images through the gate"],
            ["Rejected", blocked, "AI images stopped"],
          ].map(([k, v, sub]) => (
            <div key={k as string} className="card px-5 py-5">
              <div className="text-xs font-medium text-muted">{k}</div>
              <div className="num mt-1 text-3xl font-bold tracking-tight">{v === null ? "—" : String(v)}</div>
              <div className="mt-0.5 text-xs text-dim">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="eyebrow">Recent</div>
            <h2 className="mt-2 text-3xl">Coins that passed</h2>
            <div className="mt-6"><RecentLaunches /></div>
          </div>
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="mt-2 text-3xl">Three steps</h2>
            <ol className="mt-6 space-y-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="card flex gap-4 p-5">
                  <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg text-sm font-bold text-bg">{i + 1}</span>
                  <div>
                    <div className="font-bold">{t}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-elev/60 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="eyebrow">The rule</div>
          <h2 className="mt-2 text-3xl">What gets through</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {RULES.map(([t, d]) => (
              <div key={t} className="card p-6">
                <span className={`stamp ${t === "Allowed" ? "stamp-green" : "stamp-rose"}`}>{t}</span>
                <p className="mt-4 leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-fg px-8 py-12 text-bg sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-3xl">Made something real?</h3>
              <p className="mt-2 max-w-lg text-bg/70">Connect your wallet, upload your image, set a dev buy and deploy. Your wallet is the creator; your rewards stay yours.</p>
            </div>
            <Link href="/launch" className="btn h-12 bg-bg px-7 text-base text-fg hover:bg-white">Launch a coin</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
