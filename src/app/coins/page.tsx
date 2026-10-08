import Link from "next/link";
import { CoinGallery } from "@/components/RecentLaunches";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `coins that passed — ${BRAND}` };

export default function CoinsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="pill pill-green rotate-[-2deg]">verified human-made</span>
          <h1 className="mt-4 text-5xl sm:text-6xl">coins that passed</h1>
          <p className="mt-3 max-w-2xl text-xl text-muted">
            every coin here was deployed through {BRAND}, which means its picture went through the gate and came out the other side. no AI slop. real
            people, real pictures, real projects.
          </p>
        </div>
        <Link href="/launch" className="btn btn-primary h-13 px-7 text-lg">launch yours</Link>
      </div>
      <CoinGallery />
      <p className="mt-10 text-sm text-dim">
        listed from this server&apos;s own records. the list only includes coins made through the launchpad; coins launched straight on pump.fun aren&apos;t
        checked and aren&apos;t here.
      </p>
    </div>
  );
}
