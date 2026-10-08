import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { ToastProvider } from './ToastProvider'
import { useToast } from '../../hooks/toastContext'
import { Modal } from './Modal'

function Host({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <Modal title="Details" description="About this" onClose={() => { onClose(); setOpen(false) }} footer={<button>Save</button>}>
          <input aria-label="First field" />
        </Modal>
      )}
    </>
  )
}

describe('Modal', () => {
  it('est exposée comme boîte de dialogue nommée', async () => {
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    const dialog = screen.getByRole('dialog', { name: 'Details' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('About this')).toBeInTheDocument()
  })

  it('se ferme avec Échap, avec la croix et en cliquant sur le fond', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Host onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('dialog').parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('ne se ferme pas quand on clique dans la fenêtre', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', { name: 'Open' }))

    await user.click(screen.getByText('About this'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('rend le reste de la page inerte, bloque le scroll, puis rend le focus au déclencheur', async () => {
    const user = userEvent.setup()
    const { container } = render(<Host />)
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.click(trigger)
    expect(container).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(container).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('garde le focus dans la fenêtre avec Tab et Maj+Tab', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const close = screen.getByRole('button', { name: 'Close dialog' })
    const save = screen.getByRole('button', { name: 'Save' })

    save.focus()
    await user.tab()
    expect(close).toHaveFocus()

    await user.tab({ shift: true })
    expect(save).toHaveFocus() 
  })
})

describe('ConfirmDialog', () => {
  it('met le focus sur « Cancel » et n\'exécute rien tant qu\'on ne confirme pas', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog title="Archive Slack?" message="Are you sure?" confirmLabel="Archive" onConfirm={onConfirm} onCancel={onCancel} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('désactive le bouton pendant l\'action pour éviter un double clic', async () => {
    let finish!: () => void
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    render(<ConfirmDialog tone="danger" title="Delete?" message="Sure?" confirmLabel="Delete" onConfirm={onConfirm} onCancel={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    await act(async () => finish())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled())
  })
})

function ToastButtons() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.success('Saved!')}>ok</button>
      <button onClick={() => toast.error('Boom')}>ko</button>
    </>
  )
}

describe('ToastProvider', () => {
  it('affiche les succès (status) et les erreurs (alert), et se ferme à la main', async () => {
    const user = userEvent.setup()
    render(<ToastProvider><ToastButtons /></ToastProvider>)

    await user.click(screen.getByText('ok'))
    await user.click(screen.getByText('ko'))
    expect(screen.getByRole('status')).toHaveTextContent('Saved!')
    expect(screen.getByRole('alert')).toHaveTextContent('Boom')

    await user.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0])
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('disparaît tout seul après quelques secondes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      render(<ToastProvider><ToastButtons /></ToastProvider>)
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByText('ok'))
      expect(screen.getByRole('status')).toBeInTheDocument()

      await act(async () => { vi.advanceTimersByTime(4100) })

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
