import { TokenView } from "@/components/TokenView";

export default async function TokenPage({ params }: PageProps<"/t/[mint]">) {
  const { mint } = await params;
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <TokenView mint={mint} />
    </div>
  );
}
