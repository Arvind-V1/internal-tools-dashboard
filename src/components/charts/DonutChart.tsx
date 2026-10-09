import { useState } from 'react'
import type { CostSlice } from '../../lib/analytics'
import { formatEuro } from '../../lib/format'
import { ChartTooltip, TooltipRow } from './ChartTooltip'
import { seriesColor } from './scale'

interface DonutChartProps {
  title: string
  slices: CostSlice[]
  activeKey?: string | null
  onSelect?: (slice: CostSlice) => void
  centerLabel: string
  centerValue: string
}

const SIZE = 200
const RADIUS = 78
const STROKE = 26
const GAP = 2 

export function DonutChart({ title, slices, activeKey, onSelect, centerLabel, centerValue }: DonutChartProps) {
  const [hover, setHover] = useState<{ slice: CostSlice; x: number; y: number } | null>(null)
  const circumference = 2 * Math.PI * RADIUS
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((sum, s) => sum + s.share * circumference, 0))

  return (
    <div className="relative mx-auto w-full max-w-[220px]" onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${title}: ${slices.map((s) => `${s.label} ${formatEuro(s.cost)}`).join(', ')}`} className="block w-full -rotate-90">
        {slices.map((slice, index) => {
          const length = Math.max(0, slice.share * circumference - (slices.length > 1 ? GAP : 0))
          const start = starts[index]
          const dimmed = activeKey != null && activeKey !== slice.key
          const handleMove = (event: React.PointerEvent<SVGCircleElement>) => {
            const box = event.currentTarget.ownerSVGElement!.parentElement!.getBoundingClientRect()
            setHover({ slice, x: event.clientX - box.left, y: event.clientY - box.top })
          }
          return (
            <circle
              key={slice.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={seriesColor(slice.colorIndex)}
              strokeWidth={hover?.slice.key === slice.key ? STROKE + 4 : STROKE}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-start}
              opacity={dimmed ? 0.3 : 1}
              tabIndex={onSelect ? 0 : -1}
              role={onSelect ? 'button' : undefined}
              aria-label={`${slice.label}: ${formatEuro(slice.cost)}, ${Math.round(slice.share * 100)}%`}
              aria-pressed={onSelect ? activeKey === slice.key : undefined}
              className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-150 focus-visible:stroke-[30px]"
              onPointerMove={handleMove}
              onClick={() => onSelect?.(slice)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect?.(slice))}
              onFocus={() => setHover({ slice, x: SIZE / 2, y: 20 })}
              onBlur={() => setHover(null)}
            />
          )
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-fg-muted">{centerLabel}</span>
        <span className="text-xl font-bold">{centerValue}</span>
      </div>
      {hover && (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={220}>
          <p className="mb-1 font-semibold">{hover.slice.label}</p>
          <TooltipRow color={seriesColor(hover.slice.colorIndex)} label="Monthly cost" value={formatEuro(hover.slice.cost)} />
          <TooltipRow label="Share" value={`${Math.round(hover.slice.share * 100)}%`} />
        </ChartTooltip>
      )}
    </div>
  )
}
