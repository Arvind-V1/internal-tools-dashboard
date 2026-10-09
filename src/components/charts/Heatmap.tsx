import { useState } from 'react'
import { HEAT_HOURS, type Heatmap as HeatmapData } from '../../lib/analytics'
import { ChartTooltip, TooltipRow } from './ChartTooltip'

export function Heatmap({ data }: { data: HeatmapData }) {
  const [hover, setHover] = useState<{ day: string; hour: number; value: number; x: number; y: number } | null>(null)

  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <div role="table" aria-label="Activity by weekday and hour" className="overflow-x-auto">
        <div className="grid min-w-[420px] gap-[3px]" style={{ gridTemplateColumns: `34px repeat(${HEAT_HOURS.length}, minmax(0, 1fr))` }}>
          <span />
          {HEAT_HOURS.map((h) => (
            <span key={h} className="text-center text-[11px] text-fg-subtle">{h}h</span>
          ))}
          {data.rows.map((row) => (
            <div key={row.day} role="row" className="contents">
              <span className="flex items-center text-[11px] text-fg-subtle">{row.day}</span>
              {row.cells.map((value, i) => {
                const intensity = data.max > 0 ? value / data.max : 0
                return (
                  <span
                    key={i}
                    role="cell"
                    tabIndex={0}
                    aria-label={`${row.day} ${HEAT_HOURS[i]}h: ${value} active sessions`}
                    className="h-7 sm:h-8 rounded-[4px] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-violet-500"
                    style={{ background: `color-mix(in srgb, var(--heat) ${Math.round(8 + intensity * 92)}%, transparent)` }}
                    onPointerMove={(e) => {
                      const box = e.currentTarget.closest('[role="table"]')!.parentElement!.getBoundingClientRect()
                      setHover({ day: row.day, hour: HEAT_HOURS[i], value, x: e.clientX - box.left, y: e.clientY - box.top })
                    }}
                    onFocus={(e) => {
                      const box = e.currentTarget.closest('[role="table"]')!.parentElement!.getBoundingClientRect()
                      const cell = e.currentTarget.getBoundingClientRect()
                      setHover({ day: row.day, hour: HEAT_HOURS[i], value, x: cell.left - box.left + cell.width / 2, y: cell.top - box.top })
                    }}
                    onBlur={() => setHover(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-fg-subtle">
        Less
        {[0.1, 0.35, 0.6, 0.85, 1].map((v) => (
          <span key={v} aria-hidden="true" className="h-3 w-5 rounded-[3px]" style={{ background: `color-mix(in srgb, var(--heat) ${Math.round(8 + v * 92)}%, transparent)` }} />
        ))}
        More
      </div>
      {hover && (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={600}>
          <p className="mb-1 font-semibold">{hover.day} · {hover.hour}:00</p>
          <TooltipRow label="Active sessions" value={String(hover.value)} />
        </ChartTooltip>
      )}
    </div>
  )
}
