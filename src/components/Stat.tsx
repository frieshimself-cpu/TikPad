export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card min-w-0 px-4 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-dim">{label}</div>
      <div className="num mt-1 truncate text-lg font-semibold xl:text-xl">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
