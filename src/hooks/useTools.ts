import { useQuery } from '@tanstack/react-query'
import { listTools } from '../services/toolsRepository'
import type { Tool } from '../types/tool'

export const TOOLS_QUERY_KEY = ['tools'] as const

export function useTools<T = Tool[]>(select?: (tools: Tool[]) => T) {
  return useQuery<Tool[], Error, T>({
    queryKey: TOOLS_QUERY_KEY,
    queryFn: listTools,
    retry: false, 
    staleTime: 60_000,
    select,
  })
}
