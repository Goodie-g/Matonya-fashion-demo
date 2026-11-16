export default function StatCard({ label, value, hint }) {
  return (
    <div className="border border-linen bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
        {label}
      </p>
      <p className="text-2xl font-display">{value}</p>
      {hint && <p className="text-xs text-smoke mt-1">{hint}</p>}
    </div>
  )
}
