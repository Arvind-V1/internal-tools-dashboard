import type { ReactNode } from 'react'

interface ChartCardProps {
  id: string
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function ChartCard({ id, title, subtitle, action, className = '', children }: ChartCardProps) {
  return (
    <section aria-labelledby={id} className={`card min-w-0 p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-lg leading-7 font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SectionTitle({ children, description }: { children: ReactNode; description?: string }) {
  return (
    <div className="mt-2">
      <h2 className="text-xl leading-8 font-semibold">{children}</h2>
      {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
    </div>
  )
}
