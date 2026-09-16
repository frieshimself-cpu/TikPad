export function TokenImage({ src, symbol, size = 40 }: { src?: string | null; symbol: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={symbol} width={size} height={size} className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="num inline-flex shrink-0 items-center justify-center rounded-xl border border-line-strong bg-elev text-muted"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.28) }}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}
