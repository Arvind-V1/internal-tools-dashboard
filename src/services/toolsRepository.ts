import { buildSeedTools } from '../data/mock'
import { CATEGORY_ICONS, DEFAULT_ICON } from '../lib/constants'
import type { Tool, ToolInput } from '../types/tool'
import { ApiError } from './errors'

let db: Tool[] | null = null

const ensureDb = () => (db ??= buildSeedTools())
const snapshot = () => structuredClone(ensureDb())

export function resetToolsDb() {
  db = null
}

const delay = (max = Infinity) => new Promise((resolve) => setTimeout(resolve, Math.min(Number(import.meta.env.VITE_MOCK_DELAY ?? 800), max)))
const flag = (value: string) => new URLSearchParams(window.location.search).get('mock') === value

async function read() {
  await delay()
  if (flag('error')) throw new ApiError('server', 'Simulated server error')
}

async function write() {
  await delay(400)
  if (flag('write-error')) throw new ApiError('server', 'Simulated write error')
}

const nameTaken = (name: string, exceptId?: number) =>
  ensureDb().some((t) => t.id !== exceptId && t.name.toLowerCase() === name.trim().toLowerCase())

const conflict = (name: string) => new ApiError('conflict', `A tool named “${name.trim()}” already exists`)

export async function listTools(): Promise<Tool[]> {
  await read()
  return snapshot()
}

export async function createTool(input: ToolInput): Promise<Tool[]> {
  await write()
  if (nameTaken(input.name)) throw conflict(input.name)
  const tools = ensureDb()
  tools.push({
    ...input,
    name: input.name.trim(),
    icon: input.icon ?? CATEGORY_ICONS[input.category] ?? DEFAULT_ICON,
    id: Math.max(0, ...tools.map((t) => t.id)) + 1,
    lastUpdate: new Date().toISOString(),
  })
  return snapshot()
}

export async function updateTool(id: number, patch: Partial<ToolInput>): Promise<Tool[]> {
  await write()
  const tool = ensureDb().find((t) => t.id === id)
  if (!tool) throw new ApiError('not-found', `Tool ${id} does not exist`)
  if (patch.name !== undefined && nameTaken(patch.name, id)) throw conflict(patch.name)
  Object.assign(tool, patch, { name: (patch.name ?? tool.name).trim(), lastUpdate: new Date().toISOString() })
  return snapshot()
}

export async function updateTools(ids: number[], patch: Partial<ToolInput>): Promise<Tool[]> {
  await write()
  const now = new Date().toISOString()
  for (const tool of ensureDb()) {
    if (ids.includes(tool.id)) Object.assign(tool, patch, { lastUpdate: now })
  }
  return snapshot()
}

export async function deleteTools(ids: number[]): Promise<Tool[]> {
  await write()
  db = ensureDb().filter((t) => !ids.includes(t.id))
  return snapshot()
}
