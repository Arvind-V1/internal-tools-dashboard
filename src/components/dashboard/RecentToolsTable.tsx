import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, Calendar, ChevronsUpDown, Eye, MoreHorizontal, Pencil, SearchX, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { Skeleton } from '../ui/Skeleton'
import { StatusBadge } from '../ui/StatusBadge'
import { Pagination } from './Pagination'
import type { Tool } from '../../types/tool'
import { formatEuro, formatNumber } from '../../lib/format'
import { filterTools, nextSort, paginate, sortTools, type SortKey, type SortState } from '../../lib/toolTable'

const COLUMNS: { key: SortKey; label: string; width: string; hide: string }[] = [
  { key: 'name', label: 'Tool', width: 'w-[38%] md:w-[25.2%]', hide: '' },
  { key: 'department', label: 'Department', width: 'md:w-[25.9%]', hide: 'hidden md:table-cell' },
  { key: 'users', label: 'Users', width: 'sm:w-[14%] md:w-[11.8%]', hide: 'hidden sm:table-cell' },
  { key: 'monthlyCost', label: 'Monthly Cost', width: 'w-[28%] sm:w-[22%] md:w-[20.7%]', hide: '' },
  { key: 'status', label: 'Status', width: '', hide: '' },
]
const CELL = 'px-2 sm:px-4'

interface RecentToolsTableProps {
  tools: Tool[]
  query: string
  onClearSearch: () => void
  onView: (tool: Tool) => void
  onEdit: (tool: Tool) => void
  onDelete: (tool: Tool) => void
}

function CardHeader() {
  return (
    <div className="mb-6 flex h-8 items-center justify-between">
      <h2 className="text-xl leading-8 font-semibold">Recent Tools</h2>
      <span className="flex items-center gap-2 text-sm text-fg-muted">
        <Calendar size={16} aria-hidden="true" />
        Last 30 days
      </span>
    </div>
  )
}

function SortHeader({ column, sort, onSort }: { column: (typeof COLUMNS)[number]; sort: SortState | null; onSort: (key: SortKey) => void }) {
  const active = sort?.key === column.key
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown

  return (
    <th scope="col" aria-sort={ariaSort} className={clsx(CELL, 'pt-4 pb-2.5 text-left text-sm font-normal text-fg-muted', column.width, column.hide)}>
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className="group/sort -mx-1 inline-flex items-center gap-1.5 rounded px-1 transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      >
        {column.label}
        <Icon size={14} aria-hidden="true" className={clsx('transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60')} />
      </button>
    </th>
  )
}

export function RecentToolsTable({ tools, query, onClearSearch, onView, onEdit, onDelete }: RecentToolsTableProps) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [pageState, setPageState] = useState({ page: 1, resetKey: '' })

  const filtered = filterTools(tools, query)
  const sorted = sortTools(filtered, sort)
  const resetKey = `${query}|${sort?.key}|${sort?.dir}`
  const requested = pageState.resetKey === resetKey ? pageState.page : 1
  const { items, page, totalPages, start } = paginate(sorted, requested)

  return (
    <section aria-labelledby="recent-tools-title" className="card p-6">
      <div className="sr-only" id="recent-tools-title">Recent Tools</div>
      <CardHeader />

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <SearchX size={28} className="mb-3 text-fg-subtle" aria-hidden="true" />
          <p className="font-medium">No tools match “{query}”</p>
          <p className="mt-1 text-sm text-fg-muted">Try another name, department or status.</p>
          <button type="button" onClick={onClearSearch} className="mt-4 rounded-lg border border-field-line px-3 py-1.5 text-sm transition-colors hover:bg-hover">
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {COLUMNS.map((column) => (
                    <SortHeader key={column.key} column={column} sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((tool) => (
                  <tr key={tool.id} className="group h-[61px] border-b border-line-soft transition-colors hover:bg-hover">
                    <td className={CELL}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span aria-hidden="true" className="w-5 text-center text-base leading-none">{tool.icon}</span>
                        <span className="truncate font-medium" title={tool.name}>{tool.name}</span>
                      </div>
                    </td>
                    <td className={clsx(CELL, 'hidden text-fg-muted md:table-cell')}>{tool.department}</td>
                    <td className={clsx(CELL, 'hidden text-fg-muted sm:table-cell')}>{formatNumber(tool.users)}</td>
                    <td className={clsx(CELL, 'text-fg-muted')}>{formatEuro(tool.monthlyCost)}</td>
                    <td className={CELL}>
                      <div className="flex items-center justify-between gap-1">
                        <StatusBadge status={tool.status} />
                        <Dropdown
                          label={`Actions for ${tool.name}`}
                          triggerClassName="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted opacity-0 transition hover:bg-hover hover:text-fg focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                          trigger={<MoreHorizontal size={18} />}
                        >
                          {(close) => (
                            <>
                              <DropdownItem icon={<Eye size={16} />} onSelect={() => { close(); onView(tool) }}>View</DropdownItem>
                              <DropdownItem icon={<Pencil size={16} />} onSelect={() => { close(); onEdit(tool) }}>Edit</DropdownItem>
                              <DropdownItem icon={<Trash2 size={16} />} danger onSelect={() => { close(); onDelete(tool) }}>Delete</DropdownItem>
                            </>
                          )}
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              from={start + 1}
              to={start + items.length}
              total={sorted.length}
              onPageChange={(p) => setPageState({ page: p, resetKey })}
            />
          )}
        </>
      )}
    </section>
  )
}

export function RecentToolsTableSkeleton() {
  return (
    <section aria-label="Loading recent tools" aria-busy="true" className="card p-6">
      <CardHeader />
      <div className="flex gap-4 border-b border-line px-2 pt-4 pb-[18px] sm:px-4">
        {COLUMNS.map((c) => (
          <Skeleton key={c.key} className={clsx('h-4 w-16', c.hide)} />
        ))}
      </div>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex h-[61px] items-center gap-4 border-b border-line-soft px-2 sm:px-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="hidden h-4 w-28 md:block" />
          <Skeleton className="ml-auto h-5 w-14" />
        </div>
      ))}
    </section>
  )
}
