export default function Spinner({ fullPage = false, label = 'Loading…' }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-linen border-t-ink" />
      <p className="text-sm text-smoke">{label}</p>
    </div>
  )
  if (fullPage) return <div className="min-h-[60vh] flex items-center justify-center">{spinner}</div>
  return spinner
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <h2 className="text-xl">{title}</h2>
      {message && <p className="text-smoke text-sm max-w-sm">{message}</p>}
      {action}
    </div>
  )
}
