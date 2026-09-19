import { TokenView } from "@/components/TokenView";

export default async function TokenPage({ params }: PageProps<"/t/[mint]">) {
  const { mint } = await params;
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-12">
      <TokenView mint={mint} />
    </div>
  );
}
