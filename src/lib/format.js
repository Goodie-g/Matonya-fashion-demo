// Tanzanian shilling formatting — no decimals, e.g. "TZS 45,000".
const tzs = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
})

export function formatPrice(amount) {
  return tzs.format(Math.round(Number(amount) || 0))
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
