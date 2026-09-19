export function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#141210" />
        <path d="M16 25s-8-5.2-8-11.2A4.6 4.6 0 0 1 16 11a4.6 4.6 0 0 1 8 2.8C24 19.8 16 25 16 25Z" fill="#FBCFE8" />
        <path d="M11 14.5c0-1.4.9-2.5 2.2-2.8" stroke="#DB2777" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="text-[18px] font-extrabold uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>FansPad</span>
    </span>
  );
}
