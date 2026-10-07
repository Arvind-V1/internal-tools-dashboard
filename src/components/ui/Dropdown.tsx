import { clsx } from 'clsx'
import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { useDismiss } from '../../hooks/useClickOutside'

interface DropdownProps {
  label: string
  trigger: ReactNode
  triggerClassName?: string
  panelClassName?: string
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

export function Dropdown({ label, trigger, triggerClassName, panelClassName, align = 'right', children }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={panelId}
          role="menu"
          className={clsx(
            'absolute z-50 mt-2 min-w-44 rounded-xl border border-line bg-surface p-1.5 shadow-xl shadow-black/20',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  icon?: ReactNode
  danger?: boolean
  onSelect: () => void
  children: ReactNode
}

export function DropdownItem({ icon, danger, onSelect, children }: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={clsx(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-none',
        danger ? 'text-red-500' : 'text-fg',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
