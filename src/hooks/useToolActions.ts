import { useCallback } from 'react'
import type { Tool, ToolStatus } from '../types/tool'
import { useToast } from './toastContext'
import { useToolMutations } from './useToolMutations'

const describe = (tools: Tool[]) => (tools.length === 1 ? tools[0].name : `${tools.length} tools`)

export function useToolActions() {
  const toast = useToast()
  const { bulkUpdate, remove } = useToolMutations()
  const bulkUpdateAsync = bulkUpdate.mutateAsync
  const removeAsync = remove.mutateAsync

  const setStatus = useCallback(
    async (tools: Tool[], status: ToolStatus, verb: string) => {
      const targets = tools.filter((t) => t.status !== status)
      if (targets.length === 0) return true
      try {
        await bulkUpdateAsync({ ids: targets.map((t) => t.id), patch: { status } })
        toast.success(`${describe(targets)} ${verb}`)
        return true
      } catch {
        toast.error(`Couldn't update ${describe(targets)}. Please try again.`)
        return false
      }
    },
    [bulkUpdateAsync, toast],
  )

  const removeTools = useCallback(
    async (tools: Tool[]) => {
      try {
        await removeAsync(tools.map((t) => t.id))
        toast.success(`${describe(tools)} deleted`)
        return true
      } catch {
        toast.error(`Couldn't delete ${describe(tools)}. Please try again.`)
        return false
      }
    },
    [removeAsync, toast],
  )

  return { setStatus, remove: removeTools }
}
