export const DEPARTMENTS = ['Communication', 'Design', 'Engineering', 'Finance', 'HR', 'Marketing', 'Operations', 'Sales'] as const

export const CATEGORIES = ['Communication', 'Design', 'Development', 'Finance', 'Marketing', 'Productivity', 'Sales', 'Security'] as const

export const CATEGORY_ICONS: Record<string, string> = {
  Communication: '💬',
  Design: '🎨',
  Development: '⚡',
  Finance: '💶',
  Marketing: '📣',
  Productivity: '📝',
  Sales: '💼',
  Security: '🔒',
}

export const DEFAULT_ICON = '🧩'

export const FORM_STATUSES = ['active', 'expiring', 'unused', 'disabled'] as const

export const ALL_STATUSES = ['active', 'expiring', 'unused', 'disabled', 'archived'] as const
