import { TONE_GRADIENTS } from '../../lib/styles'
import type { KpiTone } from '../../types/tool'

export function TrendBadge({ tone, children }: { tone: KpiTone; children: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-linear-to-r px-2 py-[3px] text-xs font-medium text-white ${TONE_GRADIENTS[tone]}`}>
      {children}
    </span>
  )
}
