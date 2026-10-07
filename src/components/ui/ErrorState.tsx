import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { DashboardError } from '../../services/dashboard'

interface ErrorStateProps {
  error: unknown
  onRetry: () => void
  retrying?: boolean
}

/** Message d'erreur contextuel : explique la cause probable et propose de réessayer */
export function ErrorState({ error, onRetry, retrying }: ErrorStateProps) {
  const isNetwork = error instanceof DashboardError && error.kind === 'network'
  const Icon = isNetwork ? WifiOff : AlertTriangle

  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-rose-600 text-white">
        <Icon size={22} />
      </span>
      <h2 className="text-lg font-semibold">{isNetwork ? "Can't reach the server" : 'Unable to load dashboard data'}</h2>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        {isNetwork
          ? 'Check your connection, or that the Internal Tools API is running, then try again.'
          : 'Something went wrong on our side while fetching your tools. Your data is safe — please try again in a moment.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <RefreshCw size={16} className={retrying ? 'animate-spin' : undefined} />
        Try again
      </button>
    </div>
  )
}
