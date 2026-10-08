import { Clock, Gauge, Layers, Lightbulb, PiggyBank, X, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { Recommendation, RecommendationKind } from '../lib/recommendations';
import { formatEuro } from '../lib/format';
import { BUTTON } from '../lib/styles';

const KINDS: Record<RecommendationKind, { icon: LucideIcon; gradient: string }> = {
  unused: { icon: PiggyBank, gradient: 'from-red-500 to-rose-600' },
  expiring: { icon: Clock, gradient: 'from-amber-500 to-orange-600' },
  overlap: { icon: Layers, gradient: 'from-blue-500 to-violet-600' },
  cost: { icon: Gauge, gradient: 'from-pink-500 to-rose-600' },
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[]
  savings: number
  onAction: (recommendation: Recommendation) => void
}

export function RecommendationsPanel({ recommendations, savings, onAction }: RecommendationsPanelProps) {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set())
  const visible = recommendations.filter((r) => !dismissed.has(r.id))
  if (visible.length === 0) return null

  return (
    <section aria-label="Smart suggestions" className="card p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
          <Lightbulb size={16} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl leading-7 font-semibold">Smart suggestions</h2>
        </div>
        {savings > 0 && (
          <p className="ml-auto text-sm text-fg-muted">
            Potential savings <span className="font-semibold text-fg">{formatEuro(savings)}/month</span>
          </p>
        )}
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {visible.map((rec, index) => {
          const { icon: Icon, gradient } = KINDS[rec.kind]
          return (
            <li key={rec.id} className={`${index >= 2 ? 'hidden md:flex' : 'flex'} items-start gap-3 rounded-xl border border-line-soft p-4 transition-colors hover:bg-hover`}>
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white ${gradient}`}>
                <Icon size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{rec.title}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{rec.detail}</p>
                <button type="button" onClick={() => onAction(rec)} className={`${BUTTON.secondary} ${BUTTON.small} mt-3`}>{rec.actionLabel}</button>
              </div>
              <button
                type="button"
                aria-label={`Dismiss suggestion: ${rec.title}`}
                onClick={() => setDismissed(new Set([...dismissed, rec.id]))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle hover:bg-hover hover:text-fg"
              >
                <X size={14} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
