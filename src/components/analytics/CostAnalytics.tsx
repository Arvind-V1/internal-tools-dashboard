import { Gauge, PiggyBank, Target, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatEuro } from '../../lib/format'
import type { AnalyticsModel } from '../../lib/analyticsModel'
import { formatRoi } from '../../lib/insights'
import type { AnalyticsScope } from '../../lib/analyticsModel'
import { BarList } from '../charts/BarList'
import { DonutChart } from '../charts/DonutChart'
import { LineChart } from '../charts/LineChart'
import { seriesColor } from '../charts/scale'
import { ChartCard } from './ChartCard'
import { MetricCard } from './MetricCard'

const signed = (value: number, suffix = '%') => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}${suffix}`

export function CostMetrics({ model }: { model: AnalyticsModel }) {
  const { summary, outlook, budget, roi } = model
  const used = Math.round(outlook.used * 100)
  const barTone = outlook.status === 'over' ? 'from-red-500 to-rose-600' : outlook.status === 'warning' ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'
  const months = outlook.monthsToLimit

  return (
    <section aria-label="Cost metrics" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label={model.scoped ? 'Scope Spend' : 'Monthly Spend'} value={formatEuro(summary.spend)} suffix={model.scoped ? undefined : `/${formatEuro(budget)}`} trend={signed(summary.spendTrend)} tone="green" icon={Gauge} />
      <MetricCard label={model.scoped ? 'Org. Budget Progress' : 'Budget Progress'} value={`${used}%`} suffix=" used" trend={outlook.status === 'over' ? 'Over budget' : outlook.status === 'warning' ? 'Watch closely' : 'On track'} tone={outlook.status === 'ok' ? 'blue' : 'orange'} icon={Target}>
        <div role="progressbar" aria-label="Budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, used)} className="mt-3 h-2 overflow-hidden rounded-full bg-fg/[0.08]">
          <div className={`h-full rounded-full bg-linear-to-r ${barTone}`} style={{ width: `${Math.min(100, used)}%` }} />
        </div>
        <p className="mt-2 text-xs text-fg-subtle">
          {outlook.remaining >= 0 ? `${formatEuro(outlook.remaining)} left` : `${formatEuro(-outlook.remaining)} over`}
          {months !== null && months > 0 && ` · limit in ~${Math.max(1, Math.round(months))} mo`}
        </p>
      </MetricCard>
      <MetricCard label="Cost / Active User" value={formatEuro(Math.round(summary.costPerActiveUser))} trend={`${summary.activeUsers.toLocaleString('en-US')} active users`} tone="pink" icon={Users} />
      <MetricCard label="Portfolio ROI" value={formatRoi(roi.portfolio)} trend={`${formatEuro(Math.round(model.savings))} to save`} tone="orange" icon={PiggyBank} />
    </section>
  )
}

interface CostChartsProps {
  model: AnalyticsModel
  scope: AnalyticsScope
  onDrill: (department: string) => void
  dimmed?: boolean
}

export function CostCharts({ model, scope, onDrill, dimmed }: CostChartsProps) {
  const { forecast, series, slices, expensive, sliceBy } = model
  const lastForecast = forecast.points[forecast.points.length - 1]
  const trend = forecast.slopePerMonth
  const drilled = Boolean(scope.department)

  return (
    <div className={`grid gap-6 transition-opacity lg:grid-cols-3 ${dimmed ? 'opacity-60' : ''}`}>
      <ChartCard
        id="spend-title"
        title="Monthly Spend Evolution"
        subtitle={lastForecast ? `Projected ${formatEuro(lastForecast.value)} in 3 months (${trend >= 0 ? '+' : '−'}${formatEuro(Math.abs(trend))}/month)` : undefined}
        className="lg:col-span-2"
        action={
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted" aria-label="Legend">
            <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded bg-linear-to-r from-blue-500 to-violet-600" />Actual</li>
            <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded border-t-2 border-dashed border-orange-500" />Forecast</li>
            {!model.scoped && <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: 'var(--series-4)' }} />Budget</li>}
          </ul>
        }
      >
        <LineChart title="Monthly spend" points={series} forecast={forecast.points} reference={model.scoped ? undefined : { value: model.budget, label: `Budget ${formatEuro(model.budget)}` }} format={formatEuro} />
      </ChartCard>

      <ChartCard id="breakdown-title" title={sliceBy === 'department' ? 'Department Cost Breakdown' : `${scope.department} · Cost by Tool`} subtitle={sliceBy === 'department' ? 'Select a department to drill down' : undefined}>
        {slices.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">No cost data for this selection.</p>
        ) : (
          <>
            <DonutChart
              title="Cost breakdown"
              slices={slices}
              activeKey={drilled && sliceBy === 'department' ? scope.department : null}
              onSelect={sliceBy === 'department' ? (s) => onDrill(scope.department === s.label ? '' : s.label) : undefined}
              centerLabel="per month"
              centerValue={formatEuro(model.summary.spend)}
            />
            <ul className="mt-5 space-y-1.5 text-sm" aria-label="Breakdown legend">
              {slices.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: seriesColor(s.colorIndex) }} />
                  {sliceBy === 'department' ? (
                    <button type="button" onClick={() => onDrill(s.label)} className="truncate text-left hover:underline focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">{s.label}</button>
                  ) : s.toolId ? (
                    <Link to={`/tools?view=${s.toolId}`} className="truncate hover:underline">{s.label}</Link>
                  ) : (
                    <span className="truncate">{s.label}</span>
                  )}
                  <span className="ml-auto shrink-0 font-semibold">{formatEuro(s.cost)}</span>
                  <span className="w-9 shrink-0 text-right text-fg-subtle">{Math.round(s.share * 100)}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </ChartCard>

      <ChartCard
        id="expensive-title"
        title="Top Expensive Tools"
        subtitle="Monthly cost, with share of total spend"
        className="lg:col-span-3"
        action={<Link to={`/tools${scope.department ? `?department=${encodeURIComponent(scope.department)}` : ''}`} className="text-sm font-medium text-violet-500 hover:underline">View in catalog</Link>}
      >
        {expensive.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">No tools match this selection.</p>
        ) : (
          <div className="grid gap-x-12 gap-y-3.5 lg:grid-cols-2">
            <BarList label="Most expensive tools" items={expensive.slice(0, 3).map((e) => ({ key: String(e.tool.id), label: e.tool.name, icon: e.tool.icon, value: e.tool.monthlyCost, valueLabel: formatEuro(e.tool.monthlyCost), hint: `${Math.round(e.share * 100)}% of spend`, href: `/tools?view=${e.tool.id}` }))} />
            <BarList label="Next most expensive tools" gradient="from-pink-500 to-rose-600" items={expensive.slice(3).map((e) => ({ key: String(e.tool.id), label: e.tool.name, icon: e.tool.icon, value: e.tool.monthlyCost, valueLabel: formatEuro(e.tool.monthlyCost), hint: `${Math.round(e.share * 100)}% of spend`, href: `/tools?view=${e.tool.id}` }))} />
          </div>
        )}
      </ChartCard>
    </div>
  )
}
