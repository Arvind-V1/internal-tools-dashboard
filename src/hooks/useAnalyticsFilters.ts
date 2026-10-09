import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_RANGE, parseRange, type RangeKey } from '../lib/analytics'
import { useSearchQuery } from './useSearchQuery'

export interface AnalyticsFilters {
  range: RangeKey
  department: string
  category: string
}

export function useAnalyticsFilters() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useSearchQuery()
  const filters: AnalyticsFilters = { range: parseRange(params.get('range')), department: params.get('department') ?? '', category: params.get('category') ?? '' }

  const setFilters = useCallback(
    (patch: Partial<AnalyticsFilters>) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(patch)) {
            if (value && !(key === 'range' && value === DEFAULT_RANGE)) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const clear = useCallback(() => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const key of ['department', 'category', 'q']) next.delete(key)
        return next
      },
      { replace: true },
    )
  }, [setParams])

  return { filters, query, setFilters, setQuery, clear }
}
