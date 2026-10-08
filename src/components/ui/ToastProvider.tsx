import { AlertTriangle, Check, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from '../../hooks/toastContext'

interface ToastItem {
  id: number
  kind: 'success' | 'error'
  message: string
}

const DURATIONS = { success: 4000, error: 6000 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastItem['kind'], message: string) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-3), { id, kind, message }])
      timers.current.set(id, setTimeout(() => dismiss(id), DURATIONS[kind]))
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const api = useMemo(() => ({ success: (m: string) => push('success', m), error: (m: string) => push('error', m) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className="card animate-pop-in pointer-events-auto flex w-full max-w-sm items-center gap-3 p-3 pr-2 shadow-xl"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white ${
                toast.kind === 'error' ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600'
              }`}
            >
              {toast.kind === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
            </span>
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
