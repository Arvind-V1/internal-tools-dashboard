import { Calendar, PackageOpen, Plus, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pagination } from '../components/dashboard/Pagination'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useSearchQuery } from '../hooks/useSearchQuery'
import { useToolActions } from '../hooks/useToolActions'
import { useToolFilters } from '../hooks/useToolFilters'
import { useTools } from '../hooks/useTools'
import { buildRecommendations, potentialSavings, type Recommendation } from '../lib/recommendations'
import { BUTTON } from '../lib/styles'
import { applyFilters } from '../lib/toolFilters'
import { nextSort, paginate, sortTools, type SortState } from '../lib/toolTable'
import { STATUS_VERBS, type StatusAction } from '../lib/tools'
import type { Tool, ToolStatus } from '../types/tool'
import { BulkActionBar } from '../components/tools/BulkActionBar'
import { ToolsFilters } from '../components/tools/ToolsFilters'
import { ToolsTable, ToolsTableSkeleton } from '../components/tools/ToolsTable'
import { RecommendationsPanel } from '../components/tools/RecommendationsPanel'
import { ToolFormModal } from '../components/tools/ToolFormModal'
import { ToolDetailsModal } from '../components/tools/ToolDetailsModal'

const MODAL_PARAMS = ['view', 'edit', 'new'] as const
const NO_SELECTION: ReadonlySet<number> = new Set()

type Confirmation = { kind: 'archive' | 'delete'; tools: Tool[] }

const noun = (tools: Tool[]) => (tools.length === 1 ? tools[0].name : `${tools.length} tools`)

export default function ToolsPage() {
  const { data: tools, isPending, isError, error, refetch, isFetching } = useTools()
  const [query] = useSearchQuery()
  const { filters, setFilters, clearFilters } = useToolFilters()
  const [params, setParams] = useSearchParams()
  const actions = useToolActions()

  const [sort, setSort] = useState<SortState | null>({ key: 'lastUpdate', dir: 'desc' })
  const [pageState, setPageState] = useState({ page: 1, resetKey: '' })
  const [selection, setSelection] = useState({ key: '', ids: NO_SELECTION })
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const all = useMemo(() => tools ?? [], [tools])
  const catalog = useMemo(() => sortTools(applyFilters(all, filters, query), sort), [all, filters, query, sort])
  const recommendations = useMemo(() => buildRecommendations(all), [all])

  const filterKey = JSON.stringify([query, filters])
  const pageKey = JSON.stringify([filterKey, sort])
  const { items, page, totalPages, start } = paginate(catalog, pageState.resetKey === pageKey ? pageState.page : 1)
  const selected = selection.key === filterKey ? selection.ids : NO_SELECTION
  const selectedTools = catalog.filter((t) => selected.has(t.id))
  const select = (ids: ReadonlySet<number>) => setSelection({ key: filterKey, ids })

  const openModal = (key: (typeof MODAL_PARAMS)[number], value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      MODAL_PARAMS.forEach((k) => next.delete(k))
      next.set(key, value)
      return next
    })
  const closeModal = () =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        MODAL_PARAMS.forEach((k) => next.delete(k))
        return next
      },
      { replace: true },
    )
  const toolFromParam = (key: 'view' | 'edit') => all.find((t) => String(t.id) === params.get(key))
  const viewed = toolFromParam('view')
  const edited = toolFromParam('edit')
  const adding = params.get('new') === '1'

  const changeStatus = async (targets: Tool[], status: ToolStatus, verb: string) => {
    if (await actions.setStatus(targets, status, verb)) select(NO_SELECTION)
  }
  const handleStatusAction = (tool: Tool, action: StatusAction) => {
    if (action.kind === 'archive') setConfirmation({ kind: 'archive', tools: [tool] })
    else void changeStatus([tool], action.next, STATUS_VERBS[action.kind])
  }
  const handleRecommendation = (rec: Recommendation) => {
    const { action } = rec
    const tool = 'toolId' in action ? all.find((t) => t.id === action.toolId) : undefined
    if (action.type === 'filter-category') setFilters({ category: action.category })
    else if (tool && action.type === 'archive') setConfirmation({ kind: 'archive', tools: [tool] })
    else if (tool) openModal('view', String(tool.id))
  }

  const runConfirmation = async () => {
    if (!confirmation) return
    const done =
      confirmation.kind === 'archive'
        ? await actions.setStatus(confirmation.tools, 'archived', STATUS_VERBS.archive)
        : await actions.remove(confirmation.tools)
    if (done) select(NO_SELECTION)
    setConfirmation(null)
    if (done) closeModal()
  }

  return (
    <>
      <div className="mb-[30px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-9 font-bold tracking-tight">Tools Catalog</h1>
          <p className="mt-2 text-fg-muted">Browse, filter and manage every software tool in your organization</p>
        </div>
        <button type="button" className={BUTTON.primary} onClick={() => openModal('new', '1')}>
          <Plus size={16} />Add tool
        </button>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : isPending ? (
        <section aria-label="Loading catalog" className="card p-6"><ToolsTableSkeleton /></section>
      ) : (
        <div className={selected.size > 0 ? 'space-y-6 pb-24' : 'space-y-6'}>
          <RecommendationsPanel recommendations={recommendations} savings={potentialSavings(all)} onAction={handleRecommendation} />
          <ToolsFilters tools={all} filters={filters} query={query} onChange={setFilters} onClear={clearFilters} resultCount={catalog.length} />

          <section aria-labelledby="catalog-title" className="card p-6">
            <div className="mb-6 flex h-8 items-center justify-between">
              <h2 id="catalog-title" className="text-xl leading-8 font-semibold">All Tools</h2>
              <span className="flex items-center gap-2 text-sm text-fg-muted">
                <Calendar size={16} aria-hidden="true" />
                Showing {catalog.length} of {all.length}
              </span>
            </div>

            {all.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="No tools yet"
                message="Add your first tool to start tracking costs and usage."
                action={<button type="button" className={BUTTON.primary} onClick={() => openModal('new', '1')}><Plus size={16} />Add tool</button>}
              />
            ) : catalog.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No tools match your filters"
                message="Try removing a filter or searching for something else."
                action={<button type="button" className={BUTTON.secondary} onClick={clearFilters}>Clear filters</button>}
              />
            ) : (
              <>
                {selectedTools.length > 0 && catalog.length > items.length && (
                  <p className="mb-3 flex flex-wrap items-center gap-x-3 rounded-lg bg-violet-500/10 px-4 py-2 text-sm">
                    {selectedTools.length === catalog.length ? (
                      <>
                        All {catalog.length} matching tools are selected.
                        <button type="button" className="font-medium text-violet-500 hover:underline" onClick={() => select(NO_SELECTION)}>Clear selection</button>
                      </>
                    ) : items.every((t) => selected.has(t.id)) ? (
                      <>
                        All {items.length} tools on this page are selected.
                        <button type="button" className="font-medium text-violet-500 hover:underline" onClick={() => select(new Set(catalog.map((t) => t.id)))}>
                          Select all {catalog.length} matching tools
                        </button>
                      </>
                    ) : (
                      <>{selectedTools.length} selected</>
                    )}
                  </p>
                )}
                <ToolsTable
                  tools={items}
                  sort={sort}
                  onSort={(key) => setSort(nextSort(sort, key))}
                  selected={selected}
                  onToggle={(id) => select(new Set(selected.has(id) ? [...selected].filter((x) => x !== id) : [...selected, id]))}
                  onTogglePage={(checked) => {
                    const ids = new Set(selected)
                    items.forEach((t) => (checked ? ids.add(t.id) : ids.delete(t.id)))
                    select(ids)
                  }}
                  onView={(tool) => openModal('view', String(tool.id))}
                  onEdit={(tool) => openModal('edit', String(tool.id))}
                  onStatusChange={handleStatusAction}
                  onDelete={(tool) => setConfirmation({ kind: 'delete', tools: [tool] })}
                />
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    from={start + 1}
                    to={start + items.length}
                    total={catalog.length}
                    onPageChange={(p) => setPageState({ page: p, resetKey: pageKey })}
                  />
                )}
              </>
            )}
          </section>
        </div>
      )}

      {selectedTools.length > 0 && (
        <BulkActionBar
          count={selectedTools.length}
          onEnable={() => void changeStatus(selectedTools, 'active', STATUS_VERBS.enable)}
          onDisable={() => void changeStatus(selectedTools, 'disabled', STATUS_VERBS.disable)}
          onArchive={() => setConfirmation({ kind: 'archive', tools: selectedTools })}
          onDelete={() => setConfirmation({ kind: 'delete', tools: selectedTools })}
          onClear={() => select(NO_SELECTION)}
        />
      )}

      {adding && <ToolFormModal onClose={closeModal} />}
      {edited && <ToolFormModal key={edited.id} tool={edited} onClose={closeModal} />}
      {viewed && !edited && (
        <ToolDetailsModal
          tool={viewed}
          onClose={closeModal}
          onEdit={() => openModal('edit', String(viewed.id))}
          onStatusChange={(action) =>
            action.kind === 'archive' ? setConfirmation({ kind: 'archive', tools: [viewed] }) : void actions.setStatus([viewed], action.next, STATUS_VERBS[action.kind])
          }
          onDelete={() => setConfirmation({ kind: 'delete', tools: [viewed] })}
        />
      )}
      {confirmation && (
        <ConfirmDialog
          tone={confirmation.kind === 'delete' ? 'danger' : 'default'}
          title={`${confirmation.kind === 'delete' ? 'Delete' : 'Archive'} ${noun(confirmation.tools)}?`}
          message={
            confirmation.kind === 'delete'
              ? "This permanently removes the tool from your catalog. This action can't be undone."
              : 'Archived tools are hidden from the catalog by default and no longer count toward your budget. You can restore them anytime from the Archived filter.'
          }
          confirmLabel={confirmation.kind === 'delete' ? 'Delete' : 'Archive'}
          onCancel={() => setConfirmation(null)}
          onConfirm={runConfirmation}
        />
      )}
    </>
  )
}
