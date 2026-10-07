import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface PaginationProps {
  page: number
  totalPages: number
  from: number
  to: number
  total: number
  onPageChange: (page: number) => void
}

const pageButton =
  'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-40'

export function Pagination({ page, totalPages, from, to, total, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-fg-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)} className={pageButton}>
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
            className={clsx(pageButton, p === page && 'bg-linear-to-br from-blue-500 to-violet-600 font-medium text-white hover:bg-transparent')}
          >
            {p}
          </button>
        ))}
        <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className={pageButton}>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}
