import { useState } from 'react'
import type { GrowthPoint } from '../../lib/analytics'
import { ChartTooltip, TooltipRow } from './ChartTooltip'

export function GrowthChart({ points }: { points: GrowthPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...points.map((p) => p.added), 1)
  const HEIGHT = 120

  return (
    <div className="relative" onPointerLeave={() => setActive(null)}>
      <div role="img" aria-label={`New tools per period: ${points.map((p) => `${p.label} ${p.added}`).join(', ')}`} className="flex items-end gap-2" style={{ height: HEIGHT + 22 }}>
        {points.map((p, i) => (
          <button
            key={`${p.label}-${i}`}
            type="button"
            aria-label={`${p.label}: ${p.added} new, ${p.total} total`}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <span
              className={`w-full max-w-9 rounded-t-md bg-linear-to-t from-blue-500 to-violet-600 transition-opacity ${active !== null && active !== i ? 'opacity-40' : ''} ${p.added === 0 ? 'opacity-25' : ''}`}
              style={{ height: Math.max(4, (p.added / max) * HEIGHT) }}
            />
            <span className="text-[11px] text-fg-subtle">{p.label}</span>
          </button>
        ))}
      </div>
      {active !== null && (
        <ChartTooltip x={((active + 0.5) / points.length) * 100 + 0} y={20} containerWidth={100} unit="%">
          <p className="mb-1 font-semibold">{points[active].label}</p>
          <TooltipRow label="New tools" value={String(points[active].added)} />
          <TooltipRow label="Total" value={String(points[active].total)} />
        </ChartTooltip>
      )}
    </div>
  )
}
