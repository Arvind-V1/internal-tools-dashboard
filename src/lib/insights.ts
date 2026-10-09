import type { Tool } from '../types/tool'
import { VALUE_PER_ACTIVE_USER, type BudgetOutlook, type ToolUsage } from './analytics'
import { formatEuro } from './format'

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertKind = 'budget' | 'seats' | 'overlap' | 'renewal'

export interface InsightAlert {
  id: string
  kind: AlertKind
  severity: AlertSeverity
  title: string
  detail: string
  savings: number
  toolId?: number
  href: string
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
const SEAT_WASTE_THRESHOLD = 0.4
const SEAT_WASTE_MIN_COST = 400
const RENEWAL_ADOPTION = 0.6
const OVERLAP_THRESHOLD = 3
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const unusedSavings = (tools: Tool[]) => tools.filter((t) => t.status === 'unused').reduce((s, t) => s + t.monthlyCost, 0)
const pct = (value: number) => `${Math.round(value * 100)}%`

export const seatSavings = (u: ToolUsage) => Math.round(u.tool.monthlyCost * (1 - u.adoption) * 0.8)

export function buildAlerts(usage: ToolUsage[], outlook: BudgetOutlook, budget: number, spend: number): InsightAlert[] {
  const alerts: InsightAlert[] = []

  if (outlook.status === 'over') {
    alerts.push({ id: 'budget-over', kind: 'budget', severity: 'critical', title: 'Monthly budget exceeded', detail: `${formatEuro(spend)} spent against a ${formatEuro(budget)} budget (${formatEuro(spend - budget)} over)`, savings: 0, href: '/tools' })
  } else if (outlook.status === 'warning') {
    const horizon = outlook.monthsToLimit !== null && outlook.monthsToLimit > 0 ? ` · budget reached in about ${Math.max(1, Math.round(outlook.monthsToLimit))} month${Math.round(outlook.monthsToLimit) > 1 ? 's' : ''} at this pace` : ''
    alerts.push({ id: 'budget-warning', kind: 'budget', severity: 'warning', title: `${pct(outlook.used)} of the monthly budget is used`, detail: `${formatEuro(outlook.remaining)} left${horizon}`, savings: 0, href: '/tools' })
  }

  const wasted = usage
    .filter((u) => u.tool.status !== 'unused' && u.tool.monthlyCost >= SEAT_WASTE_MIN_COST && 1 - u.adoption >= SEAT_WASTE_THRESHOLD)
    .sort((a, b) => seatSavings(b) - seatSavings(a))
    .slice(0, 2)
  for (const u of wasted) {
    alerts.push({
      id: `seats-${u.tool.id}`,
      kind: 'seats',
      severity: 'warning',
      title: `${u.tool.name}: ${u.licensed - u.active} licences are idle`,
      detail: `${pct(u.adoption)} adoption · right-sizing could save about ${formatEuro(seatSavings(u))}/month`,
      savings: seatSavings(u),
      toolId: u.tool.id,
      href: `/tools?view=${u.tool.id}`,
    })
  }

  const byCategory = new Map<string, ToolUsage[]>()
  for (const u of usage) byCategory.set(u.tool.category, [...(byCategory.get(u.tool.category) ?? []), u])
  const crowded = [...byCategory.entries()].filter(([, group]) => group.length >= OVERLAP_THRESHOLD).sort((a, b) => b[1].length - a[1].length)[0]
  if (crowded) {
    const [category, group] = crowded
    const weakest = [...group].sort((a, b) => a.adoption - b.adoption)[0]
    alerts.push({
      id: `overlap-${category}`,
      kind: 'overlap',
      severity: 'info',
      title: `${group.length} overlapping ${category} tools`,
      detail: `${weakest.tool.name} has the lowest adoption (${pct(weakest.adoption)}) · consolidating could free ${formatEuro(weakest.tool.monthlyCost)}/month`,
      savings: weakest.tool.monthlyCost,
      toolId: weakest.tool.id,
      href: `/tools?category=${encodeURIComponent(category)}`,
    })
  }

  const renewal = usage.filter((u) => u.tool.status === 'expiring' && u.adoption < RENEWAL_ADOPTION).sort((a, b) => b.tool.monthlyCost - a.tool.monthlyCost)[0]
  if (renewal) {
    alerts.push({
      id: `renewal-${renewal.tool.id}`,
      kind: 'renewal',
      severity: 'warning',
      title: `Renegotiate ${renewal.tool.name} before renewal`,
      detail: `Expiring soon with only ${pct(renewal.adoption)} adoption · ${formatEuro(seatSavings(renewal))}/month of seats to drop`,
      savings: seatSavings(renewal),
      toolId: renewal.tool.id,
      href: `/tools?view=${renewal.tool.id}`,
    })
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.savings - a.savings)
}

export function optimizationPotential(tools: Tool[], alerts: InsightAlert[]): number {
  const unusedIds = new Set(tools.filter((t) => t.status === 'unused').map((t) => t.id))
  const seatAlerts = alerts.filter((a) => (a.kind === 'seats' || a.kind === 'renewal') && a.toolId !== undefined && !unusedIds.has(a.toolId))
  return unusedSavings(tools) + sum(seatAlerts.map((a) => a.savings))
}

export interface ToolRoi {
  tool: Tool
  value: number
  roi: number
}

export const roiOf = (u: ToolUsage): ToolRoi => {
  const value = u.active * VALUE_PER_ACTIVE_USER
  return { tool: u.tool, value, roi: u.tool.monthlyCost > 0 ? (value - u.tool.monthlyCost) / u.tool.monthlyCost : 0 }
}

export interface RoiSummary {
  portfolio: number
  value: number
  best: ToolRoi | null
  worst: ToolRoi | null
}

export function summarizeRoi(usage: ToolUsage[]): RoiSummary {
  const rois = usage.filter((u) => u.tool.monthlyCost > 0).map(roiOf).sort((a, b) => b.roi - a.roi)
  const value = sum(rois.map((r) => r.value))
  const cost = sum(rois.map((r) => r.tool.monthlyCost))
  return { portfolio: cost > 0 ? (value - cost) / cost : 0, value, best: rois[0] ?? null, worst: rois.length > 1 ? rois[rois.length - 1] : null }
}

export const formatRoi = (roi: number) => `${roi >= 0 ? '+' : '−'}${Math.abs(Math.round(roi * 100)).toLocaleString('en-US')}%`
