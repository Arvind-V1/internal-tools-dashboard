import type { Tool, ToolStatus } from '../types/tool'
import { DEPARTMENTS } from './constants'
import { isLive } from './tools'

const DAY = 86_400_000

export type RangeKey = '30d' | '90d' | '1y'
export const RANGE_KEYS: readonly RangeKey[] = ['30d', '90d', '1y']
export const RANGES: Record<RangeKey, { label: string; days: number; points: number }> = {
  '30d': { label: 'Last 30 days', days: 30, points: 6 },
  '90d': { label: 'Last 90 days', days: 90, points: 7 },
  '1y': { label: 'Last 12 months', days: 365, points: 12 },
}
export const DEFAULT_RANGE: RangeKey = '90d'
export const parseRange = (value: string | null): RangeKey => (RANGE_KEYS as readonly string[]).includes(value ?? '') ? (value as RangeKey) : DEFAULT_RANGE

export const VALUE_PER_ACTIVE_USER = 120

export function unit(id: number, salt: number): number {
  let h = (Math.imul(id + 1, 374761393) + Math.imul(salt + 1, 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const daysSince = (iso: string, now: number) => Math.max(0, (now - Date.parse(iso)) / DAY)

export const startedDaysAgo = (tool: Tool, now: number) => (tool.createdAt ? daysSince(tool.createdAt, now) : 30 + unit(tool.id, 7) * 400)

export interface SeriesPoint {
  date: number
  label: string
  value: number
}

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short' })
export const formatPointLabel = (date: number, range: RangeKey) => (range === '1y' ? monthFormat : dayFormat).format(date)

export function spendAt(tool: Tool, daysAgo: number, now: number): number {
  if (daysAgo > startedDaysAgo(tool, now)) return 0
  if (!isLive(tool) && daysAgo <= daysSince(tool.lastUpdate, now)) return 0
  const yearlyGrowth = unit(tool.id, 1) * 0.5 - 0.1
  return tool.monthlyCost * clamp(1 - yearlyGrowth * (daysAgo / 365), 0.4, 1.6)
}

export function spendSeries(tools: Tool[], range: RangeKey, now: number): SeriesPoint[] {
  const { days, points } = RANGES[range]
  return Array.from({ length: points }, (_, i) => {
    const daysAgo = days * (1 - i / (points - 1))
    const date = now - daysAgo * DAY
    return { date, label: formatPointLabel(date, range), value: Math.round(sum(tools.map((t) => spendAt(t, daysAgo, now)))) }
  })
}

export interface Forecast {
  points: SeriesPoint[]
  slopePerMonth: number
}

export function forecastSpend(series: SeriesPoint[], horizon = 3): Forecast {
  const last = series[series.length - 1]
  if (!last || series.length < 2) return { points: [], slopePerMonth: 0 }
  const xs = series.map((p) => (p.date - last.date) / DAY)
  const meanX = sum(xs) / xs.length
  const meanY = sum(series.map((p) => p.value)) / series.length
  const variance = sum(xs.map((x) => (x - meanX) ** 2))
  const slopePerDay = variance === 0 ? 0 : sum(xs.map((x, i) => (x - meanX) * (series[i].value - meanY))) / variance
  const points = Array.from({ length: horizon }, (_, i) => {
    const date = last.date + (i + 1) * 30 * DAY
    return { date, label: monthFormat.format(date), value: Math.max(0, Math.round(last.value + slopePerDay * 30 * (i + 1))) }
  })
  return { points, slopePerMonth: Math.round(slopePerDay * 30) }
}

export interface BudgetOutlook {
  used: number
  remaining: number
  monthsToLimit: number | null
  status: 'ok' | 'warning' | 'over'
}

export function budgetOutlook(spend: number, slopePerMonth: number, budget: number): BudgetOutlook {
  const used = budget > 0 ? spend / budget : 0
  const monthsToLimit = spend >= budget ? 0 : slopePerMonth > 0 ? (budget - spend) / slopePerMonth : null
  const status = spend > budget ? 'over' : used >= 0.85 || (monthsToLimit !== null && monthsToLimit <= 3) ? 'warning' : 'ok'
  return { used, remaining: budget - spend, monthsToLimit, status }
}

export interface CostSlice {
  key: string
  label: string
  cost: number
  share: number
  colorIndex: number
  toolId?: number
}

export const MAX_TOOL_SLICES = 7

export function costSlices(tools: Tool[], by: 'department' | 'tool'): CostSlice[] {
  const live = tools.filter(isLive)
  const total = sum(live.map((t) => t.monthlyCost))
  const share = (cost: number) => (total > 0 ? cost / total : 0)

  if (by === 'department') {
    const groups = new Map<string, number>()
    for (const t of live) groups.set(t.department, (groups.get(t.department) ?? 0) + t.monthlyCost)
    return [...groups.entries()]
      .map(([label, cost]) => ({ key: label, label, cost, share: share(cost), colorIndex: Math.max(0, DEPARTMENTS.indexOf(label as (typeof DEPARTMENTS)[number])) }))
      .sort((a, b) => b.cost - a.cost)
  }

  const sorted = [...live].sort((a, b) => b.monthlyCost - a.monthlyCost)
  const slices: CostSlice[] = sorted.slice(0, MAX_TOOL_SLICES).map((t, i) => ({ key: String(t.id), label: t.name, cost: t.monthlyCost, share: share(t.monthlyCost), colorIndex: i, toolId: t.id }))
  const rest = sorted.slice(MAX_TOOL_SLICES)
  if (rest.length > 0) {
    const cost = sum(rest.map((t) => t.monthlyCost))
    slices.push({ key: 'other', label: `Other (${rest.length})`, cost, share: share(cost), colorIndex: -1 })
  }
  return slices
}

export interface ExpensiveTool {
  tool: Tool
  share: number
}

export function topExpensive(tools: Tool[], limit = 6): ExpensiveTool[] {
  const live = tools.filter(isLive)
  const total = sum(live.map((t) => t.monthlyCost))
  return [...live]
    .sort((a, b) => b.monthlyCost - a.monthlyCost || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((tool) => ({ tool, share: total > 0 ? tool.monthlyCost / total : 0 }))
}

export interface ToolUsage {
  tool: Tool
  licensed: number
  active: number
  adoption: number
  trend: number
  history: number[]
}

const BASE_ADOPTION: Record<ToolStatus, [floor: number, spread: number]> = {
  active: [0.72, 0.23],
  expiring: [0.5, 0.3],
  unused: [0.02, 0.14],
  disabled: [0, 0],
  archived: [0, 0],
}
const TREND_SCALE: Record<RangeKey, number> = { '30d': 0.3, '90d': 0.6, '1y': 1 }
export const HISTORY_POINTS = 8

export function toolUsage(tool: Tool, range: RangeKey, tick = 0): ToolUsage {
  const [floor, spread] = BASE_ADOPTION[tool.status]
  const jitter = tick === 0 ? 0 : (unit(tool.id, 100 + tick) - 0.5) * 0.04
  const adoption = tool.status === 'disabled' || tool.status === 'archived' ? 0 : clamp(floor + unit(tool.id, 2) * spread + jitter, 0, 1)
  const drift = tool.status === 'unused' ? -unit(tool.id, 3) * 0.08 : (unit(tool.id, 3) - 0.35) * 0.3
  const start = clamp(adoption - drift * TREND_SCALE[range], 0, 1)
  const history = Array.from({ length: HISTORY_POINTS }, (_, i) => {
    const progress = i / (HISTORY_POINTS - 1)
    const wobble = i === 0 || i === HISTORY_POINTS - 1 ? 0 : (unit(tool.id, 20 + i) - 0.5) * 0.04
    return Math.round(tool.users * clamp(start + (adoption - start) * progress + wobble, 0, 1))
  })
  return {
    tool,
    licensed: tool.users,
    active: Math.round(tool.users * adoption),
    adoption,
    trend: Math.round((adoption - start) * 100),
    history,
  }
}

export const buildUsage = (tools: Tool[], range: RangeKey, tick = 0) => tools.filter(isLive).map((t) => toolUsage(t, range, tick))

export function rankUsage(usage: ToolUsage[], order: 'most' | 'least', limit = 5): ToolUsage[] {
  const sorted = [...usage].sort((a, b) => a.adoption - b.adoption || a.tool.name.localeCompare(b.tool.name))
  return (order === 'most' ? sorted.reverse() : sorted).slice(0, limit)
}

export interface DepartmentActivity {
  department: string
  tools: number
  licensed: number
  active: number
  adoption: number
  cost: number
  trend: number
}

export function departmentActivity(usage: ToolUsage[]): DepartmentActivity[] {
  const groups = new Map<string, ToolUsage[]>()
  for (const u of usage) groups.set(u.tool.department, [...(groups.get(u.tool.department) ?? []), u])
  return [...groups.entries()]
    .map(([department, items]) => {
      const licensed = sum(items.map((u) => u.licensed))
      const active = sum(items.map((u) => u.active))
      return {
        department,
        tools: items.length,
        licensed,
        active,
        adoption: licensed > 0 ? active / licensed : 0,
        cost: sum(items.map((u) => u.tool.monthlyCost)),
        trend: licensed > 0 ? Math.round(sum(items.map((u) => u.trend * u.licensed)) / licensed) : 0,
      }
    })
    .sort((a, b) => b.adoption - a.adoption)
}

export interface GrowthPoint {
  label: string
  added: number
  total: number
}

export function growthSeries(tools: Tool[], range: RangeKey, now: number): GrowthPoint[] {
  const { days, points } = RANGES[range]
  const step = days / (points - 1)
  const started = tools.map((t) => startedDaysAgo(t, now))
  return Array.from({ length: points }, (_, i) => {
    const daysAgo = days * (1 - i / (points - 1))
    return {
      label: formatPointLabel(now - daysAgo * DAY, range),
      total: started.filter((s) => s >= daysAgo).length,
      added: started.filter((s) => s >= daysAgo && s < daysAgo + step).length,
    }
  })
}

export function recentlyAdded(tools: Tool[], range: RangeKey, now: number, limit = 4): Tool[] {
  return tools
    .filter((t) => startedDaysAgo(t, now) <= RANGES[range].days)
    .sort((a, b) => startedDaysAgo(a, now) - startedDaysAgo(b, now))
    .slice(0, limit)
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const HEAT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const
const DAY_FACTOR = [1, 1.05, 1.05, 1, 0.9, 0.12, 0.08]
const HOUR_FACTOR = [0.35, 0.7, 0.95, 1, 0.8, 0.6, 0.55, 0.85, 1, 0.95, 0.7, 0.4]
const PEAK_CONCURRENCY = 0.35

export interface Heatmap {
  rows: { day: string; cells: number[] }[]
  max: number
}

export function activityHeatmap(usage: ToolUsage[]): Heatmap {
  const active = sum(usage.map((u) => u.active))
  const rows = WEEKDAYS.map((day, d) => ({
    day,
    cells: HEAT_HOURS.map((_, h) => Math.round(active * PEAK_CONCURRENCY * DAY_FACTOR[d] * HOUR_FACTOR[h] * (0.9 + unit(d * 31 + h, 55) * 0.2))),
  }))
  return { rows, max: Math.max(0, ...rows.flatMap((r) => r.cells)) }
}

export interface Summary {
  spend: number
  activeUsers: number
  licensed: number
  adoption: number
  costPerActiveUser: number
  spendTrend: number
  liveTools: number
}

export function summarize(tools: Tool[], usage: ToolUsage[], series: SeriesPoint[]): Summary {
  const spend = sum(tools.filter(isLive).map((t) => t.monthlyCost))
  const activeUsers = sum(usage.map((u) => u.active))
  const licensed = sum(usage.map((u) => u.licensed))
  const first = series[0]?.value ?? 0
  return {
    spend,
    activeUsers,
    licensed,
    adoption: licensed > 0 ? activeUsers / licensed : 0,
    costPerActiveUser: activeUsers > 0 ? spend / activeUsers : 0,
    spendTrend: first > 0 ? Math.round(((spend - first) / first) * 100) : 0,
    liveTools: tools.filter(isLive).length,
  }
}
