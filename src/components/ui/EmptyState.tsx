import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <Icon size={28} className="mb-3 text-fg-subtle" aria-hidden="true" />
      <p className="font-medium">{title}</p>
      {message && <p className="mt-1 text-sm text-fg-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
