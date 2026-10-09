import { useId } from 'react'

interface SparklineProps {
  values: number[]
  tone?: 'brand' | 'good' | 'bad'
  label: string
  width?: number
  height?: number
}

const STROKES = { brand: ['#3b82f6', '#8b5cf6'], good: ['#10b981', '#14b8a6'], bad: ['#ef4444', '#f43f5e'] } as const

export function Sparkline({ values, tone = 'brand', label, width = 96, height = 28 }: SparklineProps) {
  const id = useId()
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 3
  const point = (v: number, i: number): [number, number] => [pad + (i / (values.length - 1)) * (width - pad * 2), pad + (1 - (v - min) / span) * (height - pad * 2)]
  const coords = values.map(point)
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = coords[coords.length - 1]
  const [from, to] = STROKES[tone]

  return (
    <svg width={width} height={height} role="img" aria-label={label} className="block shrink-0">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${id})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={to} stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  )
}
