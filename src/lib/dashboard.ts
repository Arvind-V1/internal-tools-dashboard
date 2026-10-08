import type { Tool } from '../types/tool'

export interface AppNotification {
  id: string
  title: string
  detail: string
}

export function buildNotifications(tools: Tool[]): AppNotification[] {
  return tools.flatMap((t): AppNotification[] => {
    if (t.status === 'expiring') return [{ id: `exp-${t.id}`, title: `${t.name} license expiring`, detail: `${t.department} · renew or cancel soon` }]
    if (t.status === 'unused') return [{ id: `unused-${t.id}`, title: `${t.name} looks unused`, detail: `${t.users} users · review the subscription` }]
    return []
  })
}
