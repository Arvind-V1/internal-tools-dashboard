import type { AnalyticsModel } from './analyticsModel'
import { RANGES, type RangeKey } from './analytics'
import { formatRoi, roiOf } from './insights'

export interface ReportMeta {
  range: RangeKey
  department: string
  category: string
  generatedAt: Date
}

export const reportFileName = (meta: ReportMeta, extension: string) => {
  const parts = ['analytics', meta.department, meta.category, meta.range].filter(Boolean).map((p) => p.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  return `${parts.join('-')}-${meta.generatedAt.toISOString().slice(0, 10)}.${extension}`
}

export const reportScopeLabel = (meta: ReportMeta) => [meta.department || 'All departments', meta.category || 'All categories', RANGES[meta.range].label].join(' · ')

export type ReportCell = string | number
export interface ReportSheet {
  name: string
  header: string[]
  rows: ReportCell[][]
  euroColumns?: number[]
  percentColumns?: number[]
}

export function buildReportSheets(model: AnalyticsModel, meta: ReportMeta): ReportSheet[] {
  return [
    {
      name: 'Summary',
      header: ['Metric', 'Value'],
      rows: [
        ['Scope', reportScopeLabel(meta)],
        ['Generated', meta.generatedAt.toISOString().slice(0, 16).replace('T', ' ')],
        ['Monthly spend (€)', model.summary.spend],
        ['Monthly budget (€)', model.budget],
        ['Budget used (organization)', model.outlook.used],
        ['Active tools', model.summary.liveTools],
        ['Active users', model.summary.activeUsers],
        ['Licences', model.summary.licensed],
        ['Adoption', model.summary.adoption],
        ['Cost per active user (€)', Math.round(model.summary.costPerActiveUser)],
        ['Portfolio ROI', formatRoi(model.roi.portfolio)],
        ['Potential monthly savings (€)', model.savings],
      ],
    },
    {
      name: 'Spend',
      header: ['Period', 'Monthly spend (€)', 'Type'],
      rows: [...model.series.map((p) => [p.label, p.value, 'Actual']), ...model.forecast.points.map((p) => [p.label, p.value, 'Forecast'])],
      euroColumns: [1],
    },
    {
      name: 'Tools',
      header: ['Tool', 'Department', 'Category', 'Status', 'Monthly cost (€)', 'Licences', 'Active users', 'Adoption', 'Trend (pts)', 'ROI'],
      rows: model.usage.map((u) => [u.tool.name, u.tool.department, u.tool.category, u.tool.status, u.tool.monthlyCost, u.licensed, u.active, u.adoption, u.trend, formatRoi(roiOf(u).roi)]),
      euroColumns: [4],
      percentColumns: [7],
    },
    {
      name: 'Departments',
      header: ['Department', 'Tools', 'Monthly cost (€)', 'Licences', 'Active users', 'Adoption'],
      rows: model.departments.map((d) => [d.department, d.tools, d.cost, d.licensed, d.active, d.adoption]),
      euroColumns: [2],
      percentColumns: [5],
    },
    {
      name: 'Insights',
      header: ['Severity', 'Alert', 'Detail', 'Savings (€/month)'],
      rows: model.alerts.map((a) => [a.severity, a.title, a.detail, a.savings]),
      euroColumns: [3],
    },
  ]
}
