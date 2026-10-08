import { clsx } from 'clsx'
import { Archive, ArchiveRestore, Eye, MoreHorizontal, Pencil, Power, PowerOff, Trash2, type LucideIcon } from 'lucide-react'
import { formatDate, formatEuro, formatNumber, formatRelative } from '../lib/format'
import { statusActions, type StatusAction, type StatusActionKind } from '../lib/tools'
import type { SortKey, SortState } from '../lib/toolTable'
import type { Tool } from '../types/tool'
import { Checkbox } from '../components/ui/Checkbox'
import { SortableTh } from '../components/ui/SortableTh'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'
import { Skeleton } from '../components/ui/Skeleton'

const STATUS_ICONS: Record<StatusActionKind, LucideIcon> = {
  enable: Power,
  disable: PowerOff,
  archive: Archive,
  restore: ArchiveRestore,
}

const COLUMNS: { key: SortKey; label: string; width: string; hide: string }[] = [
  { key: 'name', label: 'Tool', width: 'w-[40%] md:w-[25%]', hide: '' },
  { key: 'category', label: 'Category', width: 'lg:w-[13.5%]', hide: 'hidden lg:table-cell' },
  { key: 'department', label: 'Department', width: 'md:w-[13.5%]', hide: 'hidden md:table-cell' },
  { key: 'users', label: 'Users', width: 'sm:w-[8%]', hide: 'hidden sm:table-cell' },
  { key: 'monthlyCost', label: 'Monthly Cost', width: 'w-[26%] sm:w-[16%] md:w-[12%]', hide: '' },
  { key: 'status', label: 'Status', width: '', hide: '' },
  { key: 'lastUpdate', label: 'Updated', width: 'xl:w-[11%]', hide: 'hidden xl:table-cell' },
]
const CELL = 'px-2 sm:px-4'

interface ToolsTableProps {
  tools: Tool[]
  sort: SortState | null
  onSort: (key: SortKey) => void
  selected: ReadonlySet<number>
  onToggle: (id: number) => void
  onTogglePage: (checked: boolean) => void
  onView: (tool: Tool) => void
  onEdit: (tool: Tool) => void
  onStatusChange: (tool: Tool, action: StatusAction) => void
  onDelete: (tool: Tool) => void
}

export function ToolsTable({ tools, sort, onSort, selected, onToggle, onTogglePage, onView, onEdit, onStatusChange, onDelete }: ToolsTableProps) {
  const selectedOnPage = tools.filter((t) => selected.has(t.id)).length
  const allSelected = tools.length > 0 && selectedOnPage === tools.length

  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <table aria-label="Tools catalog" className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-10 px-2 pt-4 pb-2.5 text-left sm:w-12 sm:px-4">
              <Checkbox
                aria-label="Select all tools on this page"
                checked={allSelected}
                indeterminate={selectedOnPage > 0 && !allSelected}
                onChange={(event) => onTogglePage(event.target.checked)}
              />
            </th>
            {COLUMNS.map((column) => (
              <SortableTh key={column.key} label={column.label} sortKey={column.key} sort={sort} onSort={onSort} className={clsx(CELL, column.width, column.hide)} />
            ))}
            <th scope="col" className="w-12 pt-4 pb-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => {
            const isSelected = selected.has(tool.id)
            return (
              <tr key={tool.id} className={clsx('group h-[61px] border-b border-line-soft transition-colors hover:bg-hover', isSelected && 'bg-violet-500/5')}>
                <td className="px-2 sm:px-4">
                  <Checkbox aria-label={`Select ${tool.name}`} checked={isSelected} onChange={() => onToggle(tool.id)} />
                </td>
                <td className={CELL}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span aria-hidden="true" className="w-5 shrink-0 text-center text-base leading-none">{tool.icon}</span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onView(tool)}
                        title={tool.name}
                        className="block max-w-full truncate rounded text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                      >
                        {tool.name}
                      </button>
                      <p className="hidden truncate text-xs text-fg-muted sm:block" title={tool.description}>{tool.description}</p>
                    </div>
                  </div>
                </td>
                <td className={clsx(CELL, 'hidden truncate text-fg-muted lg:table-cell')}>{tool.category}</td>
                <td className={clsx(CELL, 'hidden truncate text-fg-muted md:table-cell')}>{tool.department}</td>
                <td className={clsx(CELL, 'hidden text-fg-muted sm:table-cell')}>{formatNumber(tool.users)}</td>
                <td className={clsx(CELL, 'text-fg-muted')}>{formatEuro(tool.monthlyCost)}</td>
                <td className={CELL}><StatusBadge status={tool.status} /></td>
                <td className={clsx(CELL, 'hidden text-fg-muted xl:table-cell')} title={formatDate(tool.lastUpdate)}>{formatRelative(tool.lastUpdate)}</td>
                <td className="pr-2 sm:pr-4">
                  <Dropdown
                    label={`Actions for ${tool.name}`}
                    triggerClassName="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted opacity-0 transition hover:bg-hover hover:text-fg focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100"
                    trigger={<MoreHorizontal size={18} />}
                  >
                    {(close) => (
                      <>
                        <DropdownItem icon={<Eye size={16} />} onSelect={() => { close(); onView(tool) }}>View details</DropdownItem>
                        <DropdownItem icon={<Pencil size={16} />} onSelect={() => { close(); onEdit(tool) }}>Edit</DropdownItem>
                        {statusActions(tool).map((action) => {
                          const Icon = STATUS_ICONS[action.kind]
                          return (
                            <DropdownItem key={action.kind} icon={<Icon size={16} />} onSelect={() => { close(); onStatusChange(tool, action) }}>
                              {action.label}
                            </DropdownItem>
                          )
                        })}
                        <DropdownItem icon={<Trash2 size={16} />} danger onSelect={() => { close(); onDelete(tool) }}>Delete</DropdownItem>
                      </>
                    )}
                  </Dropdown>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ToolsTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tools" role="status">
      <div className="flex gap-4 border-b border-line px-2 pt-4 pb-[18px] sm:px-4">
        {['w-12', 'w-16', 'w-20', 'w-16', 'w-24'].map((width, i) => (
          <Skeleton key={i} className={`h-4 ${width}`} />
        ))}
      </div>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex h-[61px] items-center gap-4 border-b border-line-soft px-2 sm:px-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="hidden h-3 w-48 sm:block" />
          </div>
          <Skeleton className="ml-auto hidden h-4 w-20 md:block" />
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </div>
  )
}
