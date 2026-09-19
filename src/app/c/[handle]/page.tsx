import { CreatorView } from "@/components/CreatorView";

export default async function CreatorPage({ params }: PageProps<"/c/[handle]">) {
  const { handle } = await params;
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-12">
      <CreatorView handle={handle} />
    </div>
  );
}
