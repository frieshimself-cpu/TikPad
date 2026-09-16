import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { TokenImage } from "@/components/TokenImage";
import { ready } from "@/lib/bootstrap";
import { balanceForMint, getToken, listCreditsForMint, tokenVolume } from "@/lib/db";
import { fmtSol, fmtUsd, short, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TokenPage({ params }: PageProps<"/t/[mint]">) {
  ready();
  const { mint } = await params;
  const t = getToken(mint);
  if (!t) notFound();
  const bal = balanceForMint(mint);
  const credits = listCreditsForMint(mint, 50);
  const vol = tokenVolume(mint);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <TokenImage src={t.image_url} symbol={t.symbol} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{t.name}</h1>
              <span className="num text-muted">${t.symbol}</span>
              {t.demo ? <span className="pill pill-amber">demo</span> : <span className="pill pill-green">live</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              Fees route to
              <Link href={`/c/${t.recipient_handle}`} className="inline-flex items-center gap-1.5 font-medium text-fg hover:underline">
                <Avatar handle={t.recipient_handle} size={18} /> @{t.recipient_handle}
              </Link>
            </div>
          </div>
          {!t.demo && (
            <a href={`https://pump.fun/coin/${t.mint}`} className="btn btn-ghost" target="_blank" rel="noreferrer">
              pump.fun ↗
            </a>
          )}
        </div>
        {t.description && <p className="mt-6 whitespace-pre-wrap text-sm text-muted">{t.description}</p>}
        <dl className="mt-6 grid gap-3 sm:grid-cols-4">
          <Box k="Fees to creator" v={fmtUsd(bal.c)} s={fmtSol(bal.l)} />
          <Box k="Tracked volume" v={fmtSol(vol, 1)} s="since launch" />
          <Box k="Dev buy" v={fmtSol(t.dev_buy_lamports)} s={short(t.launcher_wallet)} />
          <Box k="Launched" v={timeAgo(t.created_at)} s={new Date(t.created_at).toLocaleDateString()} />
        </dl>
        <div className="num mt-6 break-all text-xs text-dim">
          mint {t.mint}
          {t.create_sig && !t.demo && (
            <>
              {" · "}
              <a className="text-cyan hover:underline" href={`https://solscan.io/tx/${t.create_sig}`} target="_blank" rel="noreferrer">
                creation tx ↗
              </a>
            </>
          )}
        </div>
      </div>

      <section className="card mt-6">
        <h2 className="border-b border-line px-5 py-3 text-sm font-medium">Fee credits from this token</h2>
        {credits.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-dim">No creator fees claimed yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {credits.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="num text-xs text-dim">{timeAgo(c.ts)}{c.ref && !c.ref.startsWith("demo") ? ` · ${short(c.ref, 6)}` : ""}</span>
                <span className="num">{fmtUsd(c.usd_cents)} <span className="text-dim">· {fmtSol(c.lamports)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Box({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="rounded-xl border border-line bg-elev p-3">
      <div className="text-xs text-dim">{k}</div>
      <div className="num mt-1 text-lg font-semibold">{v}</div>
      <div className="num truncate text-xs text-dim">{s}</div>
    </div>
  );
}
