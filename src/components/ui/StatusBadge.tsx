import { STATUS_STYLES } from '../../lib/styles'
import type { ToolStatus } from '../../types/tool'

export function StatusBadge({ status }: { status: ToolStatus }) {
  const { label, gradient } = STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center rounded-md bg-linear-to-r px-2 py-0.5 text-xs font-semibold text-white ${gradient}`}>
      {label}
    </span>
  )
}
