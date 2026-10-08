"use client";

import Link from "next/link";
import { HeroArt } from "./HeroArt";
import { ContractAddress } from "./ContractAddress";
import { RecentLaunches, useLaunches } from "./RecentLaunches";
import { BRAND } from "@/lib/brand";

const STEPS = [
  ["fill in the coin", "name, ticker, picture, links and how much SOL you want to dev buy. same stuff as pump.fun."],
  ["we look at the picture", `${BRAND} reads the file's metadata and runs AI-image detectors on it. takes a few seconds. you see the verdict right away.`],
  ["deploy from your wallet", "if it passes you sign one transaction. you're the creator on pump.fun and keep all the creator rewards. if it fails, it never deploys. simple."],
];

const RULES = [
  ["NOT allowed", "midjourney, dall·e, stable diffusion, flux, imagen, firefly, whatever. AI-upscaled copies of an AI image. anything the detectors think is AI."],
  ["allowed", "photos you took. stuff you drew in paint (like our logo). art you painted. 3D you built. pixel art. memes you made. small touch-ups are fine."],
];

export function HomeView() {
  const data = useLaunches();
  const launched = data?.tokens.length ?? null;
  const blocked = data?.gate.blocked ?? null;
  const checked = data?.gate.checked ?? null;

  return (
    <div>
      <section className="px-5 pb-16 pt-12 sm:px-8 lg:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="pill pill-ink rotate-[-2deg]">pump.fun launchpad</span>
            <h1 className="mt-6 max-w-2xl pb-3 text-5xl sm:text-6xl lg:text-7xl">
              launch a coin.
              <br />
              <span className="scribble">no AI pictures.</span>
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-relaxed text-muted">
              pick a name, a picture and a dev buy, deploy to pump.fun from your own wallet. one rule: a human has to have made the picture.
              if it&apos;s AI, {BRAND} won&apos;t let it deploy. yes we drew the logo ourselves. in paint. you can tell.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/launch" className="btn btn-primary h-13 px-7 text-lg">launch a coin</Link>
              <Link href="/docs" className="btn btn-ghost h-13 px-7 text-lg">how does it check?</Link>
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
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-5">
          {[
            ["deployed", launched, "human-made coins", "tilt-l"],
            ["checked", checked, "pictures looked at", ""],
            ["rejected", blocked, "AI pictures stopped", "tilt-r"],
          ].map(([k, v, sub, tilt]) => (
            <div key={k as string} className={`card px-5 py-5 ${tilt} ${k === "rejected" ? "card-yellow" : ""}`}>
              <div className="font-display text-base">{k}</div>
              <div className="num mt-1 font-display text-4xl">{v === null ? "…" : String(v)}</div>
              <div className="mt-0.5 text-sm text-dim">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="eyebrow">recent</div>
            <h2 className="mt-1 text-4xl">coins that passed</h2>
            <div className="mt-6"><RecentLaunches /></div>
          </div>
          <div>
            <div className="eyebrow">how it works</div>
            <h2 className="mt-1 text-4xl">3 steps</h2>
            <ol className="mt-6 space-y-5">
              {STEPS.map(([t, d], i) => (
                <li key={t} className={`card flex gap-4 p-5 ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                  <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-line bg-accent text-lg">{i + 1}</span>
                  <div>
                    <div className="font-display text-lg">{t}</div>
                    <p className="mt-1 leading-relaxed text-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-line bg-elev px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="eyebrow">the one rule</div>
          <h2 className="mt-1 text-4xl">what gets through</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {RULES.map(([t, d], i) => (
              <div key={t} className={`card p-6 ${i ? "tilt-r" : "tilt-l"}`}>
                <span className={`stamp ${i ? "stamp-green" : "stamp-rose"}`}>{t}</span>
                <p className="mt-5 text-lg leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="card card-yellow mx-auto max-w-6xl px-8 py-12 sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-4xl">made something real?</h3>
              <p className="mt-2 max-w-lg text-lg text-muted">connect your wallet, upload your picture, set a dev buy, deploy. your wallet is the creator. your rewards stay yours.</p>
            </div>
            <Link href="/launch" className="btn btn-primary h-13 px-8 text-lg">launch a coin</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
