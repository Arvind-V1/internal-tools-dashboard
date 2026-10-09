import { Link } from 'react-router-dom'

export interface BarItem {
  key: string
  label: string
  icon?: string
  value: number
  valueLabel: string
  hint?: string
  colorIndex?: number
  href?: string
  onSelect?: () => void
  selected?: boolean
}

export function BarList({ items, label, gradient = 'from-blue-500 to-violet-600' }: { items: BarItem[]; label: string; gradient?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul aria-label={label} className="space-y-3.5">
      {items.map((item) => {
        const content = (
          <>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span className="truncate font-medium">{item.label}</span>
                {item.hint && <span className="hidden text-xs text-fg-subtle sm:inline">{item.hint}</span>}
              </span>
              <span className="shrink-0 font-semibold">{item.valueLabel}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-fg/[0.06]" aria-hidden="true">
              <div
                className={`h-full rounded-r-full rounded-l-sm ${item.colorIndex === undefined ? `bg-linear-to-r ${gradient}` : ''} transition-[width] duration-500`}
                style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, ...(item.colorIndex === undefined ? {} : { background: `var(--series-${(item.colorIndex % 8) + 1})` }) }}
              />
            </div>
          </>
        )
        return (
          <li key={item.key} className={item.selected === false ? 'opacity-45 transition-opacity' : 'transition-opacity'}>
            {item.onSelect ? (
              <button type="button" onClick={item.onSelect} aria-pressed={item.selected} title={`Drill down into ${item.label}`} className="-mx-2 block w-[calc(100%+1rem)] rounded-lg px-2 py-1 text-left transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                {content}
              </button>
            ) : item.href ? (
              <Link to={item.href} title={`View ${item.label} in the catalog`} className="-mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ul>
  )
}
