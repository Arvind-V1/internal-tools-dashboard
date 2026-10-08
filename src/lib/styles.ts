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
  disabled: { label: 'Disabled', gradient: 'from-slate-400 to-slate-500' },
  archived: { label: 'Archived', gradient: 'from-slate-600 to-slate-700' },
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60'

export const BUTTON = {
  primary: `${BUTTON_BASE} bg-linear-to-r from-blue-500 to-violet-600 text-white hover:opacity-90`,
  danger: `${BUTTON_BASE} bg-linear-to-r from-red-500 to-rose-600 text-white hover:opacity-90`,
  secondary: `${BUTTON_BASE} border border-field-line bg-field text-fg hover:bg-hover`,
  ghost: `${BUTTON_BASE} text-fg-muted hover:bg-hover hover:text-fg`,
  small: '!px-3 !py-1.5',
}

export const CHECKBOX = 'h-4 w-4 cursor-pointer rounded border-field-line accent-violet-500'

export const inputClass = (invalid?: boolean) =>
  `h-10 w-full rounded-lg border bg-field px-3 text-sm text-fg placeholder:text-fg-muted focus:ring-2 focus:outline-none ${
    invalid ? 'border-red-500 focus:ring-red-500/30' : 'border-field-line focus:border-violet-500 focus:ring-violet-500/30'
  }`
