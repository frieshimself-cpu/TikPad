import { CampaignsView } from "@/components/CampaignsView";

export const metadata = { title: "Campaigns — AdPad" };

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Campaigns</h1>
        <p className="mt-2 max-w-2xl text-muted">Every coin&apos;s ad budget, where it came from, and what it bought. Preview data until the ad backend is connected.</p>
      </div>
      <CampaignsView />
    </div>
  );
}
