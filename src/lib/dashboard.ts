import type { DashboardData, Tool } from '../types/tool'

export const MONTHLY_BUDGET = 30_000

export function buildDashboardFromTools(tools: Tool[]): DashboardData {
  const active = tools.filter((t) => t.status === 'active')
  const totalCost = tools.reduce((sum, t) => sum + t.monthlyCost, 0)
  const totalUsers = tools.reduce((sum, t) => sum + t.users, 0)
  const departments = new Set(tools.map((t) => t.department))

  return {
    tools,
    kpis: [
      { id: 'budget', label: 'Monthly Budget', value: Math.round(totalCost), format: 'currency', target: MONTHLY_BUDGET, trend: null, tone: 'green', icon: 'budget' },
      { id: 'tools', label: 'Active Tools', value: active.length, format: 'number', trend: null, tone: 'blue', icon: 'tools' },
      { id: 'departments', label: 'Departments', value: departments.size, format: 'number', trend: null, tone: 'orange', icon: 'departments' },
      { id: 'cost-per-user', label: 'Cost/User', value: totalUsers ? Math.round(totalCost / totalUsers) : 0, format: 'currency', trend: null, tone: 'pink', icon: 'cost' },
    ],
  }
}

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
