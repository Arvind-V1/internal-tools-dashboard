import type { ReactNode } from 'react'
import { Archive, ArchiveRestore, ExternalLink, Pencil, Power, PowerOff, Trash2, type LucideIcon } from 'lucide-react'
import { costPerUser, statusActions, type StatusAction, type StatusActionKind } from '../../lib/tools'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import type { Tool } from '../../types/tool'
import { BUTTON } from '../../lib/styles'
import { formatDate, formatEuro, formatNumber, formatRelative } from '../../lib/format'

const ICONS: Record<StatusActionKind, LucideIcon> = { enable: Power, disable: PowerOff, archive: Archive, restore: ArchiveRestore }

interface ToolDetailsModalProps {
  tool: Tool
  onClose: () => void
  onEdit: () => void
  onStatusChange: (action: StatusAction) => void
  onDelete: () => void
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

export function ToolDetailsModal({ tool, onClose, onEdit, onStatusChange, onDelete }: ToolDetailsModalProps) {
  return (
    <Modal
      size="lg"
      title={tool.name}
      description={tool.vendor}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={`${BUTTON.ghost} mr-auto !text-red-500`} onClick={onDelete}><Trash2 size={16} />Delete</button>
          {statusActions(tool).map((action) => {
            const Icon = ICONS[action.kind]
            return (
              <button key={action.kind} type="button" className={BUTTON.secondary} onClick={() => onStatusChange(action)}>
                <Icon size={16} />{action.label}
              </button>
            )
          })}
          <button type="button" className={BUTTON.primary} onClick={onEdit}><Pencil size={16} />Edit</button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-hover text-2xl">{tool.icon}</span>
        <StatusBadge status={tool.status} />
      </div>
      <p className="mb-6 text-sm text-fg-muted">{tool.description || 'No description provided.'}</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm sm:grid-cols-3">
        <Fact label="Category">{tool.category}</Fact>
        <Fact label="Department">{tool.department}</Fact>
        <Fact label="Active users">{formatNumber(tool.users)}</Fact>
        <Fact label="Monthly cost">{formatEuro(tool.monthlyCost)}</Fact>
        <Fact label="Cost per user">{formatEuro(Math.round(costPerUser(tool) * 100) / 100)}</Fact>
        <Fact label="Yearly estimate">{formatEuro(tool.monthlyCost * 12)}</Fact>
        <Fact label="Last update"><span title={formatDate(tool.lastUpdate)}>{formatRelative(tool.lastUpdate)}</span></Fact>
        <Fact label="Website">
          {tool.websiteUrl ? (
            <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-500 hover:underline">
              {tool.websiteUrl.replace(/^https?:\/\//, '')}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ) : (
            '—'
          )}
        </Fact>
      </dl>
    </Modal>
  )
}
