import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FILTER_PARAMS, parseFilters, writeFilters, type ToolFilters } from '../lib/toolFilters'

export function useToolFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const setFilters = useCallback(
    (patch: Partial<ToolFilters>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          writeFilters(next, { ...parseFilters(previous), ...patch })
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const clearFilters = useCallback(() => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const key of [...FILTER_PARAMS, 'q']) next.delete(key)
        return next
      },
      { replace: true },
    )
  }, [setParams])

  return { filters, setFilters, clearFilters }
}
