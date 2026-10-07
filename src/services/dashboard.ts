import { mockDashboard } from '../data/mock'
import { buildDashboardFromTools } from '../lib/dashboard'
import type { DashboardData, Tool, ToolStatus } from '../types/tool'

export class DashboardError extends Error {
  readonly kind: 'network' | 'server'

  constructor(kind: 'network' | 'server', message: string) {
    super(message)
    this.name = 'DashboardError'
    this.kind = kind
  }
}

interface ApiTool {
  id: number
  name: string
  category: string
  monthly_cost: number
  total_monthly_cost?: number
  owner_department: string
  status: ToolStatus
  active_users_count: number
}

const ICONS_BY_NAME: Record<string, string> = {
  slack: '💬', figma: '🎨', github: '⚡', notion: '📝', zoom: '📹', jira: '🔧', salesforce: '💼',
}
const ICONS_BY_CATEGORY: Record<string, string> = {
  Communication: '💬', Design: '🎨', Development: '⚡', Productivity: '📝', Marketing: '📣', Finance: '💶', Security: '🔒',
}

export function mapApiTool(tool: ApiTool): Tool {
  const users = tool.active_users_count
  return {
    id: tool.id,
    name: tool.name,
    icon: ICONS_BY_NAME[tool.name.toLowerCase()] ?? ICONS_BY_CATEGORY[tool.category] ?? '🧩',
    department: tool.owner_department,
    users,
    monthlyCost: tool.total_monthly_cost ?? tool.monthly_cost * users,
    status: tool.status,
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchFromMock(): Promise<DashboardData> {
  await delay(Number(import.meta.env.VITE_MOCK_DELAY ?? 800))
  if (new URLSearchParams(window.location.search).get('mock') === 'error') {
    throw new DashboardError('server', 'Simulated server error')
  }
  return structuredClone(mockDashboard)
}

async function fetchFromApi(): Promise<DashboardData> {
  let response: Response
  try {
    response = await fetch('/api/tools?limit=100')
  } catch {
    throw new DashboardError('network', 'The API is unreachable')
  }
  if (!response.ok) throw new DashboardError('server', `The API answered with status ${response.status}`)

  const body = (await response.json()) as { data: ApiTool[] }
  return buildDashboardFromTools(body.data.map(mapApiTool))
}

export function fetchDashboard(): Promise<DashboardData> {
  return import.meta.env.VITE_DATA_SOURCE === 'api' ? fetchFromApi() : fetchFromMock()
}
