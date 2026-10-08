import type { Tool, ToolInput, ToolStatus } from '../types/tool'
import { CATEGORIES, DEPARTMENTS, FORM_STATUSES } from './constants'

export interface ToolFormValues {
  name: string
  vendor: string
  category: string
  description: string
  websiteUrl: string
  department: string
  monthlyCost: string
  users: string
  status: ToolStatus
}

export type FormErrors = Partial<Record<keyof ToolFormValues, string>>

export const STEP_LABELS = ['Basics', 'Cost & ownership', 'Review'] as const

export const emptyForm = (): ToolFormValues => ({
  name: '',
  vendor: '',
  category: '',
  description: '',
  websiteUrl: '',
  department: '',
  monthlyCost: '',
  users: '0',
  status: 'active',
})

export const formFromTool = (tool: Tool): ToolFormValues => ({
  name: tool.name,
  vendor: tool.vendor,
  category: tool.category,
  description: tool.description,
  websiteUrl: tool.websiteUrl,
  department: tool.department,
  monthlyCost: String(tool.monthlyCost),
  users: String(tool.users),
  status: tool.status,
})

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateBasics(v: ToolFormValues): FormErrors {
  const errors: FormErrors = {}
  const name = v.name.trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length < 2 || name.length > 100) errors.name = 'Name must be 2-100 characters'

  const vendor = v.vendor.trim()
  if (!vendor) errors.vendor = 'Vendor is required'
  else if (vendor.length > 100) errors.vendor = 'Vendor must be 100 characters or fewer'

  if (!(CATEGORIES as readonly string[]).includes(v.category)) errors.category = 'Select a category'
  if (v.description.length > 500) errors.description = 'Description must be 500 characters or fewer'
  if (v.websiteUrl.trim() && !isHttpUrl(v.websiteUrl.trim())) errors.websiteUrl = 'Enter a valid URL starting with http:// or https://'
  return errors
}

function validateCost(v: ToolFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!(DEPARTMENTS as readonly string[]).includes(v.department)) errors.department = 'Select a department'

  const cost = Number(v.monthlyCost)
  if (v.monthlyCost.trim() === '' || !Number.isFinite(cost) || cost < 0 || cost > 1_000_000) {
    errors.monthlyCost = 'Enter an amount between 0 and 1,000,000'
  }

  const users = Number(v.users)
  if (v.users.trim() === '' || !Number.isInteger(users) || users < 0 || users > 100_000) {
    errors.users = 'Enter a whole number of users (0 or more)'
  }

  if (!(FORM_STATUSES as readonly string[]).includes(v.status) && v.status !== 'archived') errors.status = 'Select a status'
  return errors
}

export function validateStep(step: number, values: ToolFormValues): FormErrors {
  return step === 0 ? validateBasics(values) : step === 1 ? validateCost(values) : {}
}

export const validateAll = (values: ToolFormValues): FormErrors => ({ ...validateBasics(values), ...validateCost(values) })

export const hasErrors = (errors: FormErrors) => Object.values(errors).some(Boolean)

export const toToolInput = (v: ToolFormValues): ToolInput => ({
  name: v.name.trim(),
  vendor: v.vendor.trim(),
  category: v.category,
  description: v.description.trim(),
  websiteUrl: v.websiteUrl.trim(),
  department: v.department,
  monthlyCost: Number(v.monthlyCost),
  users: Number(v.users),
  status: v.status,
})
