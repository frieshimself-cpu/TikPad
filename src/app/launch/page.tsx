import { LaunchForm } from "@/components/LaunchForm";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Launch a coin — ${BRAND}` };

export default function LaunchPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <h1 className="text-5xl sm:text-6xl">launch a coin</h1>
        <p className="mt-3 max-w-2xl text-xl text-muted">same as launching on pump.fun, with your own wallet and dev buy. only difference: we look at the picture first, and AI pictures don&apos;t get through.</p>
      </div>
      <LaunchForm />
    </div>
  );
}
