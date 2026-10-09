export function niceScale(maxValue: number, ticks = 4): { max: number; ticks: number[] } {
  if (maxValue <= 0) return { max: 1, ticks: [0, 1] }
  const rough = maxValue / ticks
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude
  const count = Math.ceil(maxValue / step)
  return { max: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => i * step) }
}

export const compactNumber = (value: number) => (Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(Math.round(value)))

export const seriesColor = (index: number) => (index < 0 ? 'var(--series-other)' : `var(--series-${(index % 8) + 1})`)
