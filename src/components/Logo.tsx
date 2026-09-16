export function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="6" fill="#141210" />
        <path d="M18 7h4.2c.3 2.6 2 4.4 4.8 4.7v4.1c-1.8 0-3.4-.5-4.8-1.4v7.2a6.6 6.6 0 1 1-6.6-6.6h.8v4.2h-.8a2.4 2.4 0 1 0 2.4 2.4V7Z" fill="#F6F2EA" />
        <path d="M16 7h4.2c.3 2.6 2 4.4 4.8 4.7v4.1c-1.8 0-3.4-.5-4.8-1.4" stroke="#D9F99D" strokeWidth="1.2" opacity=".9" />
        <path d="M18 7h4.2c.3 2.6 2 4.4 4.8 4.7v4.1" stroke="#6D28D9" strokeWidth="1.2" opacity=".9" transform="translate(1.5 1.5)" />
      </svg>
      <span className="text-[18px] font-extrabold uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>TikPad</span>
    </span>
  );
}
