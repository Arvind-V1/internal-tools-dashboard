import { Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useSearchQuery } from '../../hooks/useSearchQuery'

const PLACEHOLDERS: Record<string, string> = {
  '/': 'Search tools...',
  '/tools': 'Search tools, vendors...',
  '/analytics': 'Search metrics...',
  '/settings': 'Search settings...',
}

export function SearchInput({ className }: { className?: string }) {
  const [query, setQuery] = useSearchQuery()
  const { pathname } = useLocation()
  const placeholder = PLACEHOLDERS[pathname] ?? PLACEHOLDERS['/']

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search aria-hidden="true" size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        placeholder={placeholder}
        aria-label={placeholder.replace('...', '')}
        className="h-9.5 w-full rounded-lg border border-field-line bg-field pr-3 pl-10 text-sm text-fg placeholder:text-fg-muted focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
    </div>
  )
}
