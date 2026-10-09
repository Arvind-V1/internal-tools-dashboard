import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { TONE_GRADIENTS } from '../../lib/styles'
import type { KpiTone } from '../../types/tool'
import { Skeleton } from '../ui/Skeleton'
import { TrendBadge } from '../ui/TrendBadge'

interface MetricCardProps {
  label: string
  value: string
  suffix?: string
  trend?: string
  tone: KpiTone
  icon: LucideIcon
  children?: ReactNode
}

export function MetricCard({ label, value, suffix, trend, tone, icon: Icon, children }: MetricCardProps) {
  return (
    <article className="card min-h-[177px] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-fg-subtle/60">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-fg-muted">{label}</h3>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br text-white ${TONE_GRADIENTS[tone]}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-6 text-2xl leading-9 font-bold">
        {value}
        {suffix && <span className="text-fg-subtle">{suffix}</span>}
      </p>
      <div className="mt-1 flex min-h-[22px] items-center gap-2">{trend && <TrendBadge tone={tone}>{trend}</TrendBadge>}</div>
      {children}
    </article>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="card min-h-[177px] p-6" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-6 h-9 w-32" />
      <Skeleton className="mt-1 h-[22px] w-12 rounded-full" />
    </div>
  )
}
