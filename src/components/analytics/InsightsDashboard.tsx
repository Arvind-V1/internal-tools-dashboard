import { AlertOctagon, AlertTriangle, ArrowRight, Info, LayoutDashboard, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AnalyticsModel } from '../../lib/analyticsModel'
import { formatEuro } from '../../lib/format'
import { formatRoi, roiOf, type AlertSeverity, type InsightAlert } from '../../lib/insights'
import { MetricCard } from './MetricCard'
import { ChartCard } from './ChartCard'
import { EmptyState } from '../ui/EmptyState'
import { CheckCircle2 } from 'lucide-react'

const SEVERITY: Record<AlertSeverity, { icon: LucideIcon; gradient: string; label: string }> = {
  critical: { icon: AlertOctagon, gradient: 'from-red-500 to-rose-600', label: 'Critical' },
  warning: { icon: AlertTriangle, gradient: 'from-amber-500 to-orange-600', label: 'Warning' },
  info: { icon: Info, gradient: 'from-blue-500 to-violet-600', label: 'Info' },
}

function AlertCard({ alert }: { alert: InsightAlert }) {
  const { icon: Icon, gradient, label } = SEVERITY[alert.severity]
  return (
    <li className="card flex gap-4 p-5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white ${gradient}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{alert.title}</h3>
          <span className={`rounded-md bg-linear-to-r px-2 py-0.5 text-xs font-semibold text-white ${gradient}`}>{label}</span>
        </div>
        <p className="mt-1 text-sm text-fg-muted">{alert.detail}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {alert.savings > 0 && <span className="font-semibold text-emerald-500">Save ≈ {formatEuro(alert.savings)}/month</span>}
          <Link to={alert.href} className="inline-flex items-center gap-1 font-medium text-violet-500 hover:underline">
            {alert.toolId ? 'View tool' : 'Open catalog'}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  )
}

export function InsightsDashboard({ model, dimmed }: { model: AnalyticsModel; dimmed?: boolean }) {
  const { alerts, roi, savings, usage } = model
  const unused = model.tools.filter((t) => t.status === 'unused')
  const topRoi = usage.map(roiOf).sort((a, b) => b.roi - a.roi)

  return (
    <div className={`space-y-6 transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
      <section aria-label="Insight metrics" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Potential Savings" value={formatEuro(Math.round(savings))} suffix="/mo" trend={`${formatEuro(Math.round(savings * 12))}/year`} tone="green" icon={Sparkles} />
        <MetricCard label="Unused Tools" value={String(unused.length)} trend={`${formatEuro(unused.reduce((s, t) => s + t.monthlyCost, 0))}/month`} tone="pink" icon={AlertTriangle} />
        <MetricCard label="Best ROI" value={roi.best ? roi.best.tool.name : '—'} trend={roi.best ? formatRoi(roi.best.roi) : undefined} tone="blue" icon={TrendingUp} />
        <MetricCard label="Lowest ROI" value={roi.worst ? roi.worst.tool.name : '—'} trend={roi.worst ? formatRoi(roi.worst.roi) : undefined} tone="orange" icon={TrendingUp} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="alerts-title" className="lg:col-span-2">
          <h3 id="alerts-title" className="mb-3 text-lg font-semibold">Cost Optimization Alerts</h3>
          {alerts.length === 0 ? (
            <div className="card"><EmptyState icon={CheckCircle2} title="No alerts" message="Your spending looks healthy for this selection." /></div>
          ) : (
            <ul className="space-y-4">{alerts.map((a) => <AlertCard key={a.id} alert={a} />)}</ul>
          )}
        </section>

        <div className="space-y-6">
          <ChartCard id="roi-title" title="ROI by Tool" subtitle="Estimated value per active user vs. cost">
            <ol className="space-y-2.5 text-sm">
              {topRoi.slice(0, 6).map((r) => (
                <li key={r.tool.id} className="flex items-center justify-between gap-3">
                  <Link to={`/tools?view=${r.tool.id}`} className="truncate hover:underline"><span aria-hidden="true">{r.tool.icon} </span>{r.tool.name}</Link>
                  <span className={`shrink-0 font-semibold ${r.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatRoi(r.roi)}</span>
                </li>
              ))}
            </ol>
          </ChartCard>
          <div className="card p-5 print:hidden">
            <p className="text-sm text-fg-muted">Want to act on these insights?</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
              <Link to="/tools?status=unused" className="inline-flex items-center gap-1 text-violet-500 hover:underline">Unused tools <ArrowRight size={14} aria-hidden="true" /></Link>
              <Link to="/" className="inline-flex items-center gap-1 text-violet-500 hover:underline"><LayoutDashboard size={14} aria-hidden="true" />Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
