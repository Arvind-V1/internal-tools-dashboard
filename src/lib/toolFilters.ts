import type { Tool, ToolStatus } from '../types/tool'
import { ALL_STATUSES } from './constants'
import { statusLabel } from './tools'

export interface ToolFilters {
  department: string
  category: string
  statuses: ToolStatus[]
  min: number | null
  max: number | null
}

export const EMPTY_FILTERS: ToolFilters = { department: '', category: '', statuses: [], min: null, max: null }

export const FILTER_PARAMS = ['department', 'category', 'status', 'min', 'max'] as const

const toAmount = (value: string | null) => {
  if (value === null || value.trim() === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

export function parseFilters(params: URLSearchParams): ToolFilters {
  const statuses = (params.get('status') ?? '').split(',').filter((s): s is ToolStatus => (ALL_STATUSES as readonly string[]).includes(s))
  return {
    department: params.get('department') ?? '',
    category: params.get('category') ?? '',
    statuses: ALL_STATUSES.filter((s) => statuses.includes(s)),
    min: toAmount(params.get('min')),
    max: toAmount(params.get('max')),
  }
}

export function writeFilters(params: URLSearchParams, filters: ToolFilters) {
  const entries: Record<(typeof FILTER_PARAMS)[number], string> = {
    department: filters.department,
    category: filters.category,
    status: filters.statuses.join(','),
    min: filters.min === null ? '' : String(filters.min),
    max: filters.max === null ? '' : String(filters.max),
  }
  for (const key of FILTER_PARAMS) {
    if (entries[key]) params.set(key, entries[key])
    else params.delete(key)
  }
}

export function countActiveFilters(filters: ToolFilters): number {
  return [filters.department, filters.category, filters.statuses.length > 0, filters.min !== null, filters.max !== null].filter(Boolean).length
}

export function matchesQuery(tool: Tool, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = [tool.name, tool.description, tool.vendor, tool.category, tool.department, statusLabel(tool.status)].join(' ').toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export function applyFilters(tools: Tool[], filters: ToolFilters, query: string): Tool[] {
  return tools.filter((tool) => {
    if (filters.department && tool.department !== filters.department) return false
    if (filters.category && tool.category !== filters.category) return false
    if (filters.statuses.length > 0 ? !filters.statuses.includes(tool.status) : tool.status === 'archived') return false
    if (filters.min !== null && tool.monthlyCost < filters.min) return false
    if (filters.max !== null && tool.monthlyCost > filters.max) return false
    return matchesQuery(tool, query)
  })
}
