import type { KpiTone, ToolStatus } from '../types/tool'

export const TONE_GRADIENTS: Record<KpiTone, string> = {
  green: 'from-emerald-500 to-teal-600',
  blue: 'from-blue-500 to-violet-600',
  orange: 'from-orange-500 to-rose-500',
  pink: 'from-pink-500 to-rose-600',
}

export const STATUS_STYLES: Record<ToolStatus, { label: string; gradient: string }> = {
  active: { label: 'Active', gradient: 'from-emerald-500 to-teal-600' },
  expiring: { label: 'Expiring', gradient: 'from-amber-500 to-orange-600' },
  unused: { label: 'Unused', gradient: 'from-red-500 to-rose-600' },
}
