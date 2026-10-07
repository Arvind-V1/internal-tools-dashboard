export type ToolStatus = 'active' | 'expiring' | 'unused'

export interface Tool {
  id: number
  name: string
  icon: string
  department: string
  users: number
  monthlyCost: number
  status: ToolStatus
}

export type KpiTone = 'green' | 'blue' | 'orange' | 'pink'
export type KpiIcon = 'budget' | 'tools' | 'departments' | 'cost'

export interface Kpi {
  id: string
  label: string
  value: number
  format: 'currency' | 'number'
  target?: number
  trend: string | null
  tone: KpiTone
  icon: KpiIcon
}

export interface DashboardData {
  kpis: Kpi[]
  tools: Tool[]
}
