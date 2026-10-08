import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { BUTTON } from '../../lib/styles'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  tone?: 'danger' | 'default'
  onConfirm: () => Promise<unknown> | unknown
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, tone = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      size="sm"
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" data-autofocus className={BUTTON.secondary} onClick={onCancel}>Cancel</button>
          <button type="button" className={tone === 'danger' ? BUTTON.danger : BUTTON.primary} disabled={busy} onClick={() => void confirm()}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">{message}</p>
    </Modal>
  )
}
