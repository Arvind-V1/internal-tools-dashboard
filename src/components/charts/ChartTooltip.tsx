import type { ReactNode } from 'react'

interface ChartTooltipProps {
  x: number
  y: number
  containerWidth: number
  unit?: 'px' | '%'
  children: ReactNode
}

export function ChartTooltip({ x, y, containerWidth, unit = 'px', children }: ChartTooltipProps) {
  const flip = x > containerWidth * 0.6
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-xl shadow-black/20"
      style={{ left: `${x}${unit}`, top: y, transform: `translate(${flip ? 'calc(-100% - 12px)' : '12px'}, -50%)` }}
    >
      {children}
    </div>
  )
}

export function TooltipRow({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <p className="flex items-center gap-2 whitespace-nowrap">
      {color && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />}
      <span className="text-fg-muted">{label}</span>
      <span className="ml-auto pl-3 font-semibold text-fg">{value}</span>
    </p>
  )
}
