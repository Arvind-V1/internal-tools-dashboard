import { Archive, Power, PowerOff, Trash2, X } from 'lucide-react'
import { BUTTON } from '../lib/styles'

interface BulkActionBarProps {
  count: number
  onEnable: () => void
  onDisable: () => void
  onArchive: () => void
  onDelete: () => void
  onClear: () => void
}

export function BulkActionBar({ count, onEnable, onDisable, onArchive, onDelete, onClear }: BulkActionBarProps) {
  const button = `${BUTTON.secondary} ${BUTTON.small}`
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="animate-pop-in fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-3 shadow-2xl"
    >
      <p aria-live="polite" className="px-2 text-sm font-medium">{count} selected</p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button type="button" className={button} onClick={onEnable}><Power size={15} />Enable</button>
        <button type="button" className={button} onClick={onDisable}><PowerOff size={15} />Disable</button>
        <button type="button" className={button} onClick={onArchive}><Archive size={15} />Archive</button>
        <button type="button" className={`${button} !text-red-500`} onClick={onDelete}><Trash2 size={15} />Delete</button>
        <button type="button" aria-label="Clear selection" className={`${BUTTON.ghost} ${BUTTON.small}`} onClick={onClear}><X size={16} /></button>
      </div>
    </div>
  )
}
