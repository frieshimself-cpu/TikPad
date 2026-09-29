export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#12121a" stroke="#b8a6ff" strokeWidth="1.5" />
        <path d="M10 22V10h2.6v4.7h6.8V10H22v12h-2.6v-5H12.6v5H10Z" fill="#ece9f6" />
      </svg>
      <span className="text-[19px] font-bold tracking-tight">HushPay</span>
    </span>
  );
}
