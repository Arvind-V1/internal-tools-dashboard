import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { KpiGrid, KpiGridSkeleton } from '../components/dashboard/KpiGrid'
import { RecentToolsTable, RecentToolsTableSkeleton } from '../components/dashboard/RecentToolsTable'
import { ErrorState } from '../components/ui/ErrorState'
import { DASHBOARD_QUERY_KEY, useDashboard } from '../hooks/useDashboard'
import { useSearchQuery } from '../hooks/useSearchQuery'
import type { DashboardData, Tool } from '../types/tool'

export default function DashboardPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useDashboard()
  const [query, setQuery] = useSearchQuery()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Pas d'endpoint DELETE dans l'API : la suppression est locale (cache) en attendant le jour 7
  const handleDelete = (tool: Tool) => {
    if (!window.confirm(`Delete ${tool.name}?`)) return
    queryClient.setQueryData<DashboardData>(DASHBOARD_QUERY_KEY, (current) =>
      current && { ...current, tools: current.tools.filter((t) => t.id !== tool.id) },
    )
  }

  return (
    <>
      <div className="mb-[30px]">
        <h1 className="text-3xl leading-9 font-bold tracking-tight">Internal Tools Dashboard</h1>
        <p className="mt-2 text-fg-muted">Monitor and manage your organization's software tools and expenses</p>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : isPending ? (
        <>
          <KpiGridSkeleton />
          <div className="mt-[33px]"><RecentToolsTableSkeleton /></div>
        </>
      ) : (
        <>
          <KpiGrid kpis={data.kpis} />
          <div className="mt-[33px]">
            <RecentToolsTable
              tools={data.tools}
              query={query}
              onClearSearch={() => setQuery('')}
              onView={(tool) => void navigate(`/tools?view=${tool.id}`)}
              onEdit={(tool) => void navigate(`/tools?edit=${tool.id}`)}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}
    </>
  )
}
