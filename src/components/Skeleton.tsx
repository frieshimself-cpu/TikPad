export function Skeleton({ className = "h-40" }: { className?: string }) {
  return <div className={`card animate-pulse ${className}`} />;
}
