import { Building2, TrendingUp, Users, Wrench, type LucideIcon } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'
import { TrendBadge } from '../ui/TrendBadge'
import type { Kpi, KpiIcon } from '../../types/tool'
import { formatEuro, formatEuroCompact, formatNumber } from '../../lib/format'
import { TONE_GRADIENTS } from '../../lib/styles'

const ICONS: Record<KpiIcon, LucideIcon> = {
  budget: TrendingUp,
  tools: Wrench,
  departments: Building2,
  cost: Users,
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = ICONS[kpi.icon]
  const value = kpi.format === 'currency' ? formatEuro(kpi.value) : formatNumber(kpi.value)

  return (
    <article className="card min-h-[177px] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-fg-subtle/60">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-fg-muted">{kpi.label}</h2>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br text-white ${TONE_GRADIENTS[kpi.tone]}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-8 text-2xl leading-9 font-bold">
        {value}
        {kpi.target !== undefined && <span className="text-fg-subtle">/{formatEuroCompact(kpi.target)}</span>}
      </p>
      <div className="mt-1 flex h-[22px] items-center">{kpi.trend && <TrendBadge tone={kpi.tone}>{kpi.trend}</TrendBadge>}</div>
    </article>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="card min-h-[177px] p-6" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-8 h-9 w-32" />
      <Skeleton className="mt-1 h-[22px] w-12 rounded-full" />
    </div>
  )
}
