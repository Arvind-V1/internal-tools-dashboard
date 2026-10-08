import type { Tool, ToolStatus } from '../types/tool'
import { STATUS_STYLES } from './styles'

const DAY = 86_400_000
export const RECENT_DAYS = 30

export const statusLabel = (status: ToolStatus) => STATUS_STYLES[status].label

export function recentTools(tools: Tool[], now = Date.now()): Tool[] {
  const since = now - RECENT_DAYS * DAY
  return tools
    .filter((t) => t.status !== 'archived' && Date.parse(t.lastUpdate) >= since)
    .sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate))
}

export const costPerUser = (tool: Tool) => (tool.users > 0 ? tool.monthlyCost / tool.users : tool.monthlyCost)

export const isLive = (tool: Tool) => tool.status !== 'disabled' && tool.status !== 'archived'

export type StatusActionKind = 'enable' | 'disable' | 'archive' | 'restore'
export interface StatusAction {
  kind: StatusActionKind
  label: string
  next: ToolStatus
}

export const STATUS_VERBS: Record<StatusActionKind, string> = {
  enable: 'enabled',
  disable: 'disabled',
  archive: 'archived',
  restore: 'restored',
}

export function statusActions(tool: Tool): StatusAction[] {
  switch (tool.status) {
    case 'archived':
      return [{ kind: 'restore', label: 'Restore', next: 'active' }]
    case 'disabled':
      return [
        { kind: 'enable', label: 'Enable', next: 'active' },
        { kind: 'archive', label: 'Archive', next: 'archived' },
      ]
    default:
      return [
        { kind: 'disable', label: 'Disable', next: 'disabled' },
        { kind: 'archive', label: 'Archive', next: 'archived' },
      ]
  }
}
