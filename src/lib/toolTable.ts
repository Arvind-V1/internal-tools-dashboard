import type { Tool } from '../types/tool'

export const PAGE_SIZE = 10

export type SortKey = 'name' | 'category' | 'department' | 'users' | 'monthlyCost' | 'status' | 'lastUpdate'
export type SortDir = 'asc' | 'desc'
export interface SortState {
  key: SortKey
  dir: SortDir
}

export function filterTools(tools: Tool[], query: string): Tool[] {
  const q = query.trim().toLowerCase()
  if (!q) return tools
  return tools.filter((t) => [t.name, t.department, t.status].some((v) => v.toLowerCase().includes(q)))
}

export function sortTools(tools: Tool[], sort: SortState | null): Tool[] {
  if (!sort) return tools
  const factor = sort.dir === 'asc' ? 1 : -1
  return [...tools].sort((a, b) => {
    const left = a[sort.key]
    const right = b[sort.key]
    const result =
      typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
    return result * factor
  })
}

export function nextSort(current: SortState | null, key: SortKey): SortState | null {
  if (current?.key !== key) return { key, dir: 'asc' }
  return current.dir === 'asc' ? { key, dir: 'desc' } : null
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page: current, totalPages, start }
}
