import { CreatorView } from "@/components/CreatorView";

export default async function CreatorPage({ params }: PageProps<"/c/[handle]">) {
  const { handle } = await params;
  return (
    <div className="max-w-4xl px-6 py-12 sm:px-10">
      <CreatorView handle={handle} />
    </div>
  );
}
