export type ToolStatus = 'active' | 'expiring' | 'unused' | 'disabled' | 'archived'

export interface Tool {
  id: number
  name: string
  icon: string
  description: string
  vendor: string
  category: string
  department: string
  users: number
  monthlyCost: number
  status: ToolStatus
  websiteUrl: string
  lastUpdate: string
}

export type ToolInput = Omit<Tool, 'id' | 'lastUpdate' | 'icon'> & { icon?: string }

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
