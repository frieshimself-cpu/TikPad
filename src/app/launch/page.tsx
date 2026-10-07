import { LaunchForm } from "@/components/LaunchForm";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Launch a coin — ${BRAND}` };

export default function LaunchPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl">Launch a coin</h1>
        <p className="mt-2 max-w-2xl text-muted">Same as launching on pump.fun, with your own wallet and dev buy. The only difference: the image is checked first, and AI-generated images don&apos;t get through.</p>
      </div>
      <LaunchForm />
    </div>
  );
}
