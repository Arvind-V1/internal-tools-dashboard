const numberFormat = new Intl.NumberFormat('en-US')

export const formatNumber = (value: number) => numberFormat.format(value)

export const formatEuro = (value: number) => `€${numberFormat.format(value)}`

export const formatEuroCompact = (value: number) =>
  value >= 1000 && value % 1000 === 0 ? `€${value / 1000}k` : formatEuro(value)

const DAY = 86_400_000
const plural = (n: number, unit: string) => `${n} ${unit}${n > 1 ? 's' : ''} ago`

export function formatRelative(iso: string, now = Date.now()): string {
  const days = Math.floor((now - Date.parse(iso)) / DAY)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return plural(days, 'day')
  if (days < 30) return plural(Math.floor(days / 7), 'week')
  if (days < 365) return plural(Math.floor(days / 30), 'month')
  return plural(Math.floor(days / 365), 'year')
}

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
