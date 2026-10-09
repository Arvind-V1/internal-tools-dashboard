import { clsx } from 'clsx'
import { Download, FileSpreadsheet, FileText, Radio, RefreshCw, X } from 'lucide-react'
import { RANGES, RANGE_KEYS, type RangeKey } from '../../lib/analytics'
import { CATEGORIES, DEPARTMENTS } from '../../lib/constants'
import { BUTTON } from '../../lib/styles'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { SelectField } from '../ui/Field'

const SHORT: Record<RangeKey, string> = { '30d': '30d', '90d': '90d', '1y': '1y' }
const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }))

interface AnalyticsToolbarProps {
  range: RangeKey
  department: string
  category: string
  query: string
  onChange: (patch: { range?: RangeKey; department?: string; category?: string }) => void
  onClear: () => void
  live: boolean
  onLiveChange: (live: boolean) => void
  onRefresh: () => void
  refreshing: boolean
  updatedLabel: string
  onExportExcel: () => void
  onExportPdf: () => void
  exporting: boolean
  disabled?: boolean
}

export function AnalyticsToolbar(p: AnalyticsToolbarProps) {
  const hasScope = Boolean(p.department || p.category || p.query)

  return (
    <section aria-label="Analytics filters" className="card p-6 print:hidden">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        <div>
          <span id="range-label" className="mb-1.5 block text-sm font-medium">Time range</span>
          <div role="radiogroup" aria-labelledby="range-label" className="inline-flex h-10 rounded-lg border border-field-line bg-field p-1">
            {RANGE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={p.range === key}
                aria-label={RANGES[key].label}
                disabled={p.disabled}
                onClick={() => p.onChange({ range: key })}
                className={clsx(
                  'min-w-14 rounded-md px-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
                  p.range === key ? 'bg-linear-to-r from-blue-500 to-violet-600 text-white' : 'text-fg-muted hover:bg-hover hover:text-fg',
                )}
              >
                {SHORT[key]}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full min-w-40 sm:w-52">
          <SelectField label="Department" value={p.department} onChange={(e) => p.onChange({ department: e.target.value })} placeholder="All departments" options={options(DEPARTMENTS)} disabled={p.disabled} />
        </div>
        <div className="w-full min-w-40 sm:w-52">
          <SelectField label="Category" value={p.category} onChange={(e) => p.onChange({ category: e.target.value })} placeholder="All categories" options={options(CATEGORIES)} disabled={p.disabled} />
        </div>
        {hasScope && (
          <button type="button" onClick={p.onClear} className={`${BUTTON.ghost} h-10`}>
            <X size={16} aria-hidden="true" />Clear filters
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={p.live}
            onClick={() => p.onLiveChange(!p.live)}
            disabled={p.disabled}
            className={clsx(BUTTON.secondary, 'h-10', p.live && 'border-emerald-500/60 text-emerald-500')}
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              {p.live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />}
              <span className={clsx('relative inline-flex h-2 w-2 rounded-full', p.live ? 'bg-emerald-500' : 'bg-fg-subtle')} />
            </span>
            <Radio size={16} aria-hidden="true" />
            Live
          </button>
          <button type="button" onClick={p.onRefresh} disabled={p.disabled || p.refreshing} className={`${BUTTON.secondary} h-10`} aria-label="Refresh data">
            <RefreshCw size={16} className={p.refreshing ? 'animate-spin' : undefined} aria-hidden="true" />
          </button>
          <Dropdown label="Export report" triggerClassName={`${BUTTON.primary} h-10`} trigger={<><Download size={16} aria-hidden="true" />Export</>}>
            {(close) => (
              <>
                <DropdownItem icon={<FileSpreadsheet size={16} aria-hidden="true" />} onSelect={() => { close(); p.onExportExcel() }}>Excel (.xlsx)</DropdownItem>
                <DropdownItem icon={<FileText size={16} aria-hidden="true" />} onSelect={() => { close(); p.onExportPdf() }}>PDF (print)</DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>
      <p className="mt-4 text-xs text-fg-subtle" aria-live="polite">
        {p.exporting ? 'Preparing your report…' : p.updatedLabel}
      </p>
    </section>
  )
}
