import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KpiGrid, KpiGridSkeleton } from '../components/dashboard/KpiGrid'
import { RecentToolsTable, RecentToolsTableSkeleton } from '../components/dashboard/RecentToolsTable'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ErrorState } from '../components/ui/ErrorState'
import { useDashboard } from '../hooks/useDashboard'
import { useSearchQuery } from '../hooks/useSearchQuery'
import { useToolActions } from '../hooks/useToolActions'
import type { Tool } from '../types/tool'

export default function DashboardPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useDashboard()
  const [query, setQuery] = useSearchQuery()
  const [toDelete, setToDelete] = useState<Tool | null>(null)
  const actions = useToolActions()
  const navigate = useNavigate()

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
              onDelete={setToDelete}
            />
          </div>
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          tone="danger"
          title={`Delete ${toDelete.name}?`}
          message="This permanently removes the tool from your catalog. This action can't be undone."
          confirmLabel="Delete"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await actions.remove([toDelete])
            setToDelete(null)
          }}
        />
      )}
    </>
  )
}
