import { BRAND } from "@/lib/brand";

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#16150f" />
        <path d="M9 23 14.5 11l4 8.5 2.2-4.6L24 23" stroke="#f4f1ea" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25.5" cy="7.5" r="3.5" fill="#1f8a4c" stroke="#f4f1ea" strokeWidth="1.5" />
      </svg>
      <span className="text-[19px] font-bold tracking-tight">{BRAND}</span>
    </span>
  );
}
