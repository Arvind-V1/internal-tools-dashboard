import type { Kpi } from '../../types/tool'
import { KpiCard, KpiCardSkeleton } from './KpiCard'

const GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <section aria-label="Key metrics" className={GRID}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </section>
  )
}

export function KpiGridSkeleton() {
  return (
    <section aria-label="Loading key metrics" aria-busy="true" className={GRID}>
      {Array.from({ length: 4 }, (_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </section>
  )
}
