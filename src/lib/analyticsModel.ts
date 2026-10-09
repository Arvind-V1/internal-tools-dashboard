import type { Tool } from '../types/tool'
import {
  activityHeatmap,
  budgetOutlook,
  buildUsage,
  costSlices,
  departmentActivity,
  forecastSpend,
  growthSeries,
  rankUsage,
  recentlyAdded,
  spendSeries,
  summarize,
  topExpensive,
  type RangeKey,
} from './analytics'
import { MONTHLY_BUDGET } from './constants'
import { buildAlerts, optimizationPotential, summarizeRoi } from './insights'
import { matchesQuery } from './toolFilters'

export interface AnalyticsScope {
  range: RangeKey
  department: string
  category: string
  query: string
}

export function buildAnalytics(tools: Tool[], scope: AnalyticsScope, now: number, tick = 0) {
  const inScope = tools.filter(
    (t) => t.status !== 'archived' && (!scope.department || t.department === scope.department) && (!scope.category || t.category === scope.category) && matchesQuery(t, scope.query),
  )
  const scoped = Boolean(scope.department || scope.category)

  const orgSeries = spendSeries(tools, scope.range, now)
  const orgForecast = forecastSpend(orgSeries)
  const orgSpend = orgSeries[orgSeries.length - 1]?.value ?? 0
  const outlook = budgetOutlook(orgSpend, orgForecast.slopePerMonth, MONTHLY_BUDGET)

  const series = spendSeries(inScope, scope.range, now)
  const forecast = forecastSpend(series)
  const usage = buildUsage(inScope, scope.range, tick)
  const orgUsage = buildUsage(tools.filter((t) => t.status !== 'archived'), scope.range, tick)
  const alerts = buildAlerts(usage, outlook, MONTHLY_BUDGET, orgSpend)

  return {
    scoped,
    tools: inScope,
    budget: MONTHLY_BUDGET,
    outlook,
    orgSpend,
    orgUsage,
    series,
    forecast,
    summary: summarize(inScope, usage, series),
    slices: costSlices(inScope, scope.department ? 'tool' : 'department'),
    sliceBy: scope.department ? ('tool' as const) : ('department' as const),
    expensive: topExpensive(inScope),
    usage,
    mostUsed: rankUsage(usage, 'most'),
    leastUsed: rankUsage(usage, 'least'),
    departments: departmentActivity(usage),
    growth: growthSeries(inScope, scope.range, now),
    recent: recentlyAdded(inScope, scope.range, now),
    heatmap: activityHeatmap(usage),
    alerts,
    savings: optimizationPotential(inScope, alerts),
    roi: summarizeRoi(usage),
  }
}

export type AnalyticsModel = ReturnType<typeof buildAnalytics>
