import { clsx } from 'clsx'
import { CATEGORIES, DEPARTMENTS, ALL_STATUSES } from '../../lib/constants'
import { STATUS_STYLES } from '../../lib/styles'
import { BUTTON } from '../../lib/styles'
import { countActiveFilters, type ToolFilters } from '../../lib/toolFilters'
import type { Tool, ToolStatus } from '../../types/tool'
import { SelectField, TextField } from '../../components/ui/Field'

interface ToolsFiltersProps {
  tools: Tool[]
  filters: ToolFilters
  query: string
  onChange: (patch: Partial<ToolFilters>) => void
  onClear: () => void
  resultCount: number
}

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }))
const toAmount = (value: string) => (value.trim() === '' ? null : Math.max(0, Math.trunc(Number(value))) || 0)

export function ToolsFilters({ tools, filters, query, onChange, onClear, resultCount }: ToolsFiltersProps) {
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, tools.filter((t) => t.status === s).length]))
  const hasFilters = countActiveFilters(filters) > 0 || query.trim() !== ''
  const invalidRange = filters.min !== null && filters.max !== null && filters.min > filters.max

  const toggleStatus = (status: ToolStatus) =>
    onChange({ statuses: filters.statuses.includes(status) ? filters.statuses.filter((s) => s !== status) : [...filters.statuses, status] })

  return (
    <section aria-label="Filters" className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField label="Department" value={filters.department} onChange={(e) => onChange({ department: e.target.value })} placeholder="All departments" options={options(DEPARTMENTS)} />
        <SelectField label="Category" value={filters.category} onChange={(e) => onChange({ category: e.target.value })} placeholder="All categories" options={options(CATEGORIES)} />
        <div className="grid grid-cols-2 gap-4 sm:contents">
          <TextField label="Min cost (€)" type="number" inputMode="numeric" min={0} step={1} placeholder="0" value={filters.min ?? ''} onChange={(e) => onChange({ min: toAmount(e.target.value) })} />
        <TextField
          label="Max cost (€)"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="Any"
          value={filters.max ?? ''}
          error={invalidRange ? 'Max must be higher than min' : undefined}
          onChange={(e) => onChange({ max: toAmount(e.target.value) })}
        />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium">Status</span>
          {ALL_STATUSES.map((status) => {
            const on = filters.statuses.includes(status)
            return (
              <button
                key={status}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStatus(status)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
                  on ? `border-transparent bg-linear-to-r text-white ${STATUS_STYLES[status].gradient}` : 'border-field-line text-fg-muted hover:bg-hover hover:text-fg',
                )}
              >
                {STATUS_STYLES[status].label}
                <span className={on ? 'text-white/80' : 'text-fg-subtle'}>{counts[status]}</span>
              </button>
            )
          })}
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm text-fg-muted">
          <span aria-live="polite">{resultCount} {resultCount === 1 ? 'tool' : 'tools'} found</span>
          {hasFilters && (
            <button type="button" onClick={onClear} className={`${BUTTON.secondary} ${BUTTON.small}`}>Clear filters</button>
          )}
        </div>
      </div>
    </section>
  )
}
