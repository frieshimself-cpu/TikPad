export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="#00AFF0" />
        <path d="M16 23.5s-7-4.4-7-9.6A4 4 0 0 1 16 11.5a4 4 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6Z" fill="#fff" />
      </svg>
      <span className="text-[19px] font-bold tracking-tight">FansPad</span>
    </span>
  );
}
