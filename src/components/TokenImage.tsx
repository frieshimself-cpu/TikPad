/** ipfs.io rate-limits and serves notice pages to browsers; pump.fun's own gateway serves the same CIDs reliably. */
const gateway = (u: string) => u.replace(/^https:\/\/ipfs\.io\/ipfs\//, "https://pump.mypinata.cloud/ipfs/");

export function TokenImage({ src, symbol, size = 40 }: { src?: string | null; symbol: string; size?: number }) {
  if (src) {
    src = gateway(src);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={symbol} width={size} height={size} className="wobbly-2 shrink-0 border-[2px] border-line object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="num wobbly-2 inline-flex shrink-0 items-center justify-center border-[2px] border-line bg-elev font-display text-muted"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.28) }}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}
