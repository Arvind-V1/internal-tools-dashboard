import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTool, deleteTools, updateTool, updateTools } from '../services/toolsRepository'
import type { Tool, ToolInput } from '../types/tool'
import { TOOLS_QUERY_KEY } from './useTools'

export function useToolMutations() {
  const queryClient = useQueryClient()
  const onSuccess = (tools: Tool[]) => queryClient.setQueryData(TOOLS_QUERY_KEY, tools)

  return {
    create: useMutation({ mutationFn: (input: ToolInput) => createTool(input), onSuccess }),
    update: useMutation({ mutationFn: ({ id, patch }: { id: number; patch: Partial<ToolInput> }) => updateTool(id, patch), onSuccess }),
    bulkUpdate: useMutation({ mutationFn: ({ ids, patch }: { ids: number[]; patch: Partial<ToolInput> }) => updateTools(ids, patch), onSuccess }),
    remove: useMutation({ mutationFn: (ids: number[]) => deleteTools(ids), onSuccess }),
  }
}
