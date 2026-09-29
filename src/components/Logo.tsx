export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="#0f1419" />
        <path d="M11 22V10h5.2c2.6 0 4.3 1.5 4.3 3.8 0 1.7-.9 2.9-2.4 3.4L21.4 22h-2.8l-3-4.4h-2.1V22H11Zm2.5-6.5h2.6c1.3 0 2-.7 2-1.7s-.7-1.7-2-1.7h-2.6v3.4Z" fill="#fff" />
      </svg>
      <span className="text-[19px] font-bold tracking-tight">RePaid</span>
    </span>
  );
}
