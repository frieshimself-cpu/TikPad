import { LaunchForm } from "@/components/LaunchForm";

export const metadata = { title: "Launch a token — TikPad" };

export default async function LaunchPage({ searchParams }: PageProps<"/launch">) {
  const sp = await searchParams;
  const initialHandle = typeof sp.handle === "string" ? sp.handle : "";
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Launch a token</h1>
        <p className="mt-2 max-w-2xl text-muted">Create a pump.fun token whose creator fees pay a TikTok creator. Takes one wallet confirmation.</p>
      </div>
      <LaunchForm initialHandle={initialHandle} />
    </div>
  );
}
