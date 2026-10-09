import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { TOOLS_QUERY_KEY } from './useTools'

export const LIVE_INTERVAL_MS = 10_000

export function useLiveData(enabled: boolean, intervalMs = LIVE_INTERVAL_MS) {
  const queryClient = useQueryClient()
  const [state, setState] = useState(() => ({ tick: 0, now: Date.now() }))

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      setState((s) => ({ tick: s.tick + 1, now: Date.now() }))
      void queryClient.invalidateQueries({ queryKey: TOOLS_QUERY_KEY })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs, queryClient])

  const refresh = () => {
    setState((s) => ({ tick: s.tick + 1, now: Date.now() }))
    return queryClient.invalidateQueries({ queryKey: TOOLS_QUERY_KEY })
  }

  return { ...state, refresh }
}
