import { LaunchForm } from "@/components/LaunchForm";

export const metadata = { title: "Launch a token — HushX" };

export default function LaunchPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-12">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl">Launch a token</h1>
        <p className="mt-2 max-w-2xl text-muted">Create a coin on pump.fun in one wallet confirmation and name the X creator it pays. Rewards route through the HushX treasury automatically.</p>
      </div>
      <LaunchForm />
    </div>
  );
}
