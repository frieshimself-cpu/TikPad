import { ClaimPanel } from "@/components/ClaimPanel";

export const metadata = { title: "Claim your earnings — TikPad" };

export default async function ClaimPage({ searchParams }: PageProps<"/claim">) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const error = typeof sp.error === "string" ? sp.error : undefined;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">For creators</h1>
        <p className="mt-2 max-w-2xl text-muted">Anyone can launch a token that pays your handle. Sign in to see what has accrued and where to send it.</p>
      </div>
      <ClaimPanel demoSignIn={demo} initialError={error} />
    </div>
  );
}
