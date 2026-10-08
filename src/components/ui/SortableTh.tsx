import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { SortDir } from '../../lib/toolTable'

interface SortableThProps<K extends string> {
  label: string
  sortKey: K
  sort: { key: K; dir: SortDir } | null
  onSort: (key: K) => void
  className?: string
}

export function SortableTh<K extends string>({ label, sortKey, sort, onSort, className }: SortableThProps<K>) {
  const active = sort?.key === sortKey
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown

  return (
    <th scope="col" aria-sort={ariaSort} className={clsx('pt-4 pb-2.5 text-left text-sm font-normal text-fg-muted', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group/sort -mx-1 inline-flex items-center gap-1.5 rounded px-1 transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      >
        {label}
        <Icon size={14} aria-hidden="true" className={clsx('transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60')} />
      </button>
    </th>
  )
}
