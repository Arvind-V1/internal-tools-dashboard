import { mockKpis } from '../data/mock'
import { recentTools } from '../lib/tools'
import type { DashboardData, Tool } from '../types/tool'
import { useTools } from './useTools'

const selectDashboard = (tools: Tool[]): DashboardData => ({ kpis: mockKpis, tools: recentTools(tools) })

export function useDashboard() {
  return useTools(selectDashboard)
}
