import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import type { SeriesPoint } from '../../lib/analytics'
import { ChartTooltip, TooltipRow } from './ChartTooltip'
import { compactNumber, niceScale } from './scale'

interface LineChartProps {
  title: string
  points: SeriesPoint[]
  forecast?: SeriesPoint[]
  reference?: { value: number; label: string }
  format: (value: number) => string
  height?: number
}

const PAD = { top: 16, right: 16, bottom: 28, left: 44 }

export function LineChart({ title, points, forecast = [], reference, format, height = 320 }: LineChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const id = useId()
  const all = [...points, ...forecast]
  const innerW = Math.max(40, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - PAD.bottom

  const dataMax = Math.max(...all.map((p) => p.value), 0)
  const refInRange = reference && reference.value <= dataMax * 1.5 ? reference.value : 0
  const { max, ticks } = niceScale(Math.max(dataMax, refInRange))
  const x = (i: number) => PAD.left + (all.length > 1 ? (i / (all.length - 1)) * innerW : innerW / 2)
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH

  const line = (items: SeriesPoint[], offset: number) => items.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i + offset).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const actualPath = line(points, 0)
  const lastActual = points.length - 1
  const areaPath = `${actualPath} L${x(lastActual).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const forecastPath = forecast.length ? `M${x(lastActual).toFixed(1)},${y(points[lastActual].value).toFixed(1)} ${line(forecast, points.length).replace(/^M/, 'L')}` : ''

  const labelEvery = Math.ceil(all.length / Math.max(2, Math.floor(innerW / 64)))
  const activePoint = active === null ? null : all[active]

  const select = (clientX: number, rect: DOMRect) => {
    const ratio = (clientX - rect.left - PAD.left) / innerW
    setActive(Math.min(all.length - 1, Math.max(0, Math.round(ratio * (all.length - 1)))))
  }
  const onPointer = (event: PointerEvent<HTMLDivElement>) => select(event.clientX, event.currentTarget.getBoundingClientRect())
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowRight') setActive((a) => Math.min(all.length - 1, (a ?? -1) + 1))
    else if (event.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? all.length) - 1))
    else if (event.key === 'Escape') setActive(null)
    else return
    event.preventDefault()
  }

  return (
    <div ref={containerRef} className="relative min-w-0 touch-pan-y" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setActive(null)}>
      <svg width={width} height={height} role="img" aria-label={`${title}: ${points.map((p) => `${p.label} ${format(p.value)}`).join(', ')}`} tabIndex={0} onKeyDown={onKey} onBlur={() => setActive(null)} className="block rounded-lg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
        <defs>
          <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-forecast`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" />
            <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-fg-subtle text-[11px]">{tick === 0 ? '0' : `€${compactNumber(tick)}`}</text>
          </g>
        ))}

        {refInRange > 0 && reference && (
          <g>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--series-4)" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={width - PAD.right} y={y(reference.value) - 6} textAnchor="end" className="fill-fg-muted text-[11px]">{reference.label}</text>
          </g>
        )}

        {all.map((p, i) => i % labelEvery === 0 && (
          <text key={`${p.label}-${i}`} x={x(i)} y={height - 8} textAnchor="middle" className="fill-fg-subtle text-[11px]">{p.label}</text>
        ))}

        <path d={areaPath} fill={`url(#${id}-fill)`} />
        <path d={actualPath} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {forecastPath && <path d={forecastPath} fill="none" stroke={`url(#${id}-forecast)`} strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />}

        {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--fg-subtle)" strokeDasharray="3 3" />}
        <circle cx={x(lastActual)} cy={y(points[lastActual]?.value ?? 0)} r={4} fill="#8b5cf6" stroke="var(--surface)" strokeWidth={2} />
        {activePoint && active !== lastActual && <circle cx={x(active!)} cy={y(activePoint.value)} r={5} fill={active! > lastActual ? '#f97316' : '#8b5cf6'} stroke="var(--surface)" strokeWidth={2} />}
      </svg>

      {activePoint && active !== null && (
        <ChartTooltip x={x(active)} y={Math.max(36, y(activePoint.value))} containerWidth={width}>
          <p className="mb-1 font-semibold">{activePoint.label}{active > lastActual && <span className="ml-2 font-normal text-orange-500">Forecast</span>}</p>
          <TooltipRow color={active > lastActual ? '#f97316' : '#8b5cf6'} label="Monthly spend" value={format(activePoint.value)} />
          {reference && <TooltipRow color="var(--series-4)" label="Budget" value={format(reference.value)} />}
        </ChartTooltip>
      )}
    </div>
  )
}
