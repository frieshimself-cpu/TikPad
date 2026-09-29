export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#f5c542" />
        <path d="M7 23 14.2 8h3.6L25 23h-3.4l-1.7-3.8h-7.8L10.4 23H7Zm6.3-6.5h5.4L16 10.6l-2.7 5.9Z" fill="#0a0a0f" />
      </svg>
      <span className="text-[19px] font-extrabold tracking-tight">AdPad</span>
    </span>
  );
}
