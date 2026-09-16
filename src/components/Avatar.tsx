const PALETTE = ["#6d28d9", "#ff3d00", "#1f8a4c", "#b45309", "#0e7490", "#be185d"];

export function Avatar({ handle, src, size = 36 }: { handle: string; src?: string | null; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  let h = 0;
  for (const ch of handle) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = PALETTE[h % PALETTE.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
      aria-hidden
    >
      {handle.replace(/[^a-z0-9]/gi, "").slice(0, 1) || "?"}
    </span>
  );
}
