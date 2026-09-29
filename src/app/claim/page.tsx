import { ClaimPanel } from "@/components/ClaimPanel";

export const metadata = { title: "Claim your earnings — HushPay" };

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl">For creators</h1>
        <p className="mt-2 max-w-2xl text-muted">Anyone can launch a token that pays your username. Verify your profile to see what has accrued and where to send it.</p>
      </div>
      <ClaimPanel />
    </div>
  );
}
