/** Blue verified tick used next to creator handles. */
export function Verified({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="verified" className={`inline-block shrink-0 ${className}`}>
      <path d="M12 2.5l2.4 2 3.1-.4 1.1 2.9 2.7 1.6-.7 3 .7 3-2.7 1.6-1.1 2.9-3.1-.4-2.4 2-2.4-2-3.1.4-1.1-2.9L2.7 14.6l.7-3-.7-3 2.7-1.6 1.1-2.9 3.1.4z" fill="#00AFF0" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
