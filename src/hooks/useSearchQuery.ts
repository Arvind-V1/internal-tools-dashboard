import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useSearchQuery(): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''

  const setQuery = useCallback(
    (value: string) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (value) next.set('q', value)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return [query, setQuery]
}
