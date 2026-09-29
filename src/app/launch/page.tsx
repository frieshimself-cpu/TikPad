import { LaunchForm } from "@/components/LaunchForm";

export const metadata = { title: "Launch a token — AdPad" };

export default function LaunchPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Launch a coin</h1>
        <p className="mt-2 max-w-2xl text-muted">Create a coin on pump.fun in one wallet confirmation. Its creator rewards fund its own advertising from the first trade.</p>
      </div>
      <LaunchForm />
    </div>
  );
}
