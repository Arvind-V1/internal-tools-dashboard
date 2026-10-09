import { useIsFetching } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AnalyticsToolbar } from '../components/analytics/AnalyticsToolbar'
import { SectionTitle } from '../components/analytics/ChartCard'
import { CostCharts, CostMetrics } from '../components/analytics/CostAnalytics'
import { InsightsDashboard } from '../components/analytics/InsightsDashboard'
import { MetricCardSkeleton } from '../components/analytics/MetricCard'
import { UsageAnalytics } from '../components/analytics/UsageAnalytics'
import { useToast } from '../hooks/toastContext'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters'
import { useLiveData } from '../hooks/useLiveData'
import { useTools } from '../hooks/useTools'
import { RANGES } from '../lib/analytics'
import { buildAnalytics } from '../lib/analyticsModel'
import { exportExcel, exportPdf } from '../services/exportReport'

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function AnalyticsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading analytics" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <MetricCardSkeleton key={i} />)}</div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2"><Skeleton className="h-6 w-48" /><Skeleton className="mt-6 h-[260px] w-full" /></div>
        <div className="card p-6"><Skeleton className="h-6 w-40" /><Skeleton className="mx-auto mt-6 h-[200px] w-[200px] rounded-full" /></div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: tools, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = useTools()
  const { filters, query, setFilters, clear } = useAnalyticsFilters()
  const [live, setLive] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { tick, now, refresh } = useLiveData(live)
  const toast = useToast()
  const refetching = useIsFetching({ queryKey: ['tools'] }) > 0 && !isPending

  const scope = useMemo(() => ({ ...filters, query }), [filters, query])
  const model = useMemo(() => (tools ? buildAnalytics(tools, scope, now, tick) : null), [tools, scope, now, tick])
  const updatedLabel = dataUpdatedAt ? `${live ? 'Live · ' : ''}Last updated ${timeFormat.format(dataUpdatedAt)}` : ''

  const meta = () => ({ ...filters, generatedAt: new Date(now) })
  const onExcel = async () => {
    if (!model) return
    setExporting(true)
    try {
      const file = await exportExcel(model, meta())
      toast.success(`${file} downloaded`)
    } catch {
      toast.error("We couldn't generate the Excel report. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="mb-[30px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-9 font-bold tracking-tight">Analytics</h1>
          <p className="mt-2 text-fg-muted">Costs, adoption and optimization insights for your software stack</p>
        </div>
        <p className="hidden items-center gap-2 text-sm text-fg-muted print:flex">
          <Printer size={16} aria-hidden="true" />
          {[filters.department || 'All departments', filters.category || 'All categories', RANGES[filters.range].label].join(' · ')}
        </p>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : isPending || !model ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-6">
          <AnalyticsToolbar
            {...filters}
            query={query}
            onChange={setFilters}
            onClear={clear}
            live={live}
            onLiveChange={setLive}
            onRefresh={() => void refresh()}
            refreshing={refetching}
            updatedLabel={updatedLabel}
            onExportExcel={() => void onExcel()}
            onExportPdf={exportPdf}
            exporting={exporting}
          />

          {model.tools.length === 0 ? (
            <section className="card px-6 py-14 text-center">
              <p className="font-medium">No tools match your selection</p>
              <p className="mt-1 text-sm text-fg-muted">Try another department, category or search.</p>
              <button type="button" onClick={clear} className="mt-4 text-sm font-medium text-violet-500 hover:underline">Clear filters</button>
            </section>
          ) : (
            <>
              <SectionTitle description="Spending, budget and where the money goes">Cost Analytics</SectionTitle>
              <CostMetrics model={model} />
              <CostCharts model={model} scope={scope} onDrill={(department) => setFilters({ department })} dimmed={refetching} />
              <SectionTitle description="Adoption, rankings and activity">Usage Analytics</SectionTitle>
              <UsageAnalytics model={model} department={filters.department} onDrill={(department) => setFilters({ department })} dimmed={refetching} />
              <SectionTitle description="Alerts, savings opportunities and ROI">Insights</SectionTitle>
              <InsightsDashboard model={model} dimmed={refetching} />
            </>
          )}
        </div>
      )}
    </>
  )
}
