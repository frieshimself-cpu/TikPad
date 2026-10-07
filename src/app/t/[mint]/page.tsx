import Link from "next/link";
import { getToken } from "@/lib/server/db";
import { TokenImage } from "@/components/TokenImage";
import { VerdictCard } from "@/components/VerdictCard";
import { fmtSol, short } from "@/lib/format";
import { BRAND, pumpUrl } from "@/lib/brand";
import type { ImageVerdict } from "@/lib/verdict";

export const dynamic = "force-dynamic";

export default async function TokenPage({ params }: PageProps<"/t/[mint]">) {
  const { mint } = await params;
  const token = await getToken(mint).catch(() => undefined);

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <h1 className="text-3xl">Not launched here</h1>
        <p className="mt-3 text-muted">No record of this mint on {BRAND}. It may have been launched elsewhere, or this server has no database.</p>
        <div className="mono mt-4 break-all text-xs text-dim">{mint}</div>
        <div className="mt-6 flex justify-center gap-3">
          <a href={pumpUrl(mint)} target="_blank" rel="noreferrer" className="btn btn-primary">Open on pump.fun</a>
          <Link href="/launch" className="btn btn-ghost">Launch a coin</Link>
        </div>
      </div>
    );
  }

  let verdict: ImageVerdict | null = null;
  try {
    const v = token.verdict_json ? (JSON.parse(token.verdict_json) as Partial<ImageVerdict>) : null;
    if (v && v.summary) verdict = { allowed: true, verdict: v.verdict ?? "human", aiProbability: v.aiProbability ?? 0, threshold: v.threshold ?? 0.5, detectors: v.detectors ?? [], signals: v.signals ?? [], summary: v.summary, hash: v.hash ?? "" };
  } catch {
    /* ignore */
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <TokenImage src={token.image_url} symbol={token.symbol} size={96} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl">{token.name}</h1>
              <span className="num text-lg text-muted">${token.symbol}</span>
              <span className="stamp stamp-green">Human-made</span>
            </div>
            <div className="num mt-2 text-sm text-muted">
              Launched by {short(token.launcher_wallet)} · {new Date(token.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              {token.dev_buy_lamports > 0 ? ` · dev buy ${fmtSol(token.dev_buy_lamports)}` : ""}
            </div>
          </div>
        </div>
        {token.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-muted">{token.description}</p>}
        <div className="mono mt-6 break-all rounded-xl bg-elev p-3 text-xs text-muted">{token.mint}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={pumpUrl(token.mint)} target="_blank" rel="noreferrer" className="btn btn-primary">Trade on pump.fun</a>
          <a href={`https://solscan.io/tx/${token.create_sig}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Creation tx</a>
        </div>
      </div>
      {verdict && (
        <div className="mt-6">
          <div className="eyebrow mb-3">Image check at launch</div>
          <VerdictCard verdict={verdict} compact />
        </div>
      )}
    </div>
  );
}
