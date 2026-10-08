import { createTool, deleteTools, listTools, updateTool, updateTools } from './toolsRepository'
import type { ToolInput } from '../types/tool'

const input = (patch: Partial<ToolInput> = {}): ToolInput => ({
  name: 'Linear',
  description: 'Issue tracking',
  vendor: 'Linear Orbit',
  category: 'Development',
  department: 'Engineering',
  monthlyCost: 96,
  users: 12,
  status: 'active',
  websiteUrl: 'https://linear.app',
  ...patch,
})

describe('toolsRepository (base en mémoire)', () => {
  it('liste les 20 outils de départ, sans exposer la base', async () => {
    const tools = await listTools()
    expect(tools).toHaveLength(20)
    tools[0].name = 'Modifié'
    expect((await listTools())[0].name).toBe('Slack')
  })

  describe('createTool', () => {
    it('ajoute l\'outil avec un id, une date et une icône par catégorie', async () => {
      const tools = await createTool(input({ name: '  Linear  ' }))
      const created = tools.at(-1)!
      expect(created).toMatchObject({ id: 21, name: 'Linear', icon: '⚡', status: 'active' })
      expect(Date.now() - Date.parse(created.lastUpdate)).toBeLessThan(5000)
    })

    it('refuse un nom déjà pris, sans tenir compte de la casse', async () => {
      await expect(createTool(input({ name: 'slack' }))).rejects.toMatchObject({ kind: 'conflict', message: 'A tool named “slack” already exists' })
      expect(await listTools()).toHaveLength(20)
    })
  })

  describe('updateTool', () => {
    it('modifie les champs fournis et met à jour la date', async () => {
      const before = Date.now()
      const tools = await updateTool(1, { monthlyCost: 2000, status: 'disabled' })
      const slack = tools.find((t) => t.id === 1)!
      expect(slack).toMatchObject({ name: 'Slack', monthlyCost: 2000, status: 'disabled' })
      expect(Date.parse(slack.lastUpdate)).toBeGreaterThanOrEqual(before)
    })

    it('renvoie not-found pour un outil inconnu', async () => {
      await expect(updateTool(999, { monthlyCost: 1 })).rejects.toMatchObject({ kind: 'not-found' })
    })

    it('refuse de renommer vers un nom existant, mais accepte de garder le sien', async () => {
      await expect(updateTool(2, { name: 'Slack' })).rejects.toMatchObject({ kind: 'conflict' })
      await expect(updateTool(1, { name: 'Slack' })).resolves.toBeDefined()
    })
  })

  it('updateTools applique le même changement à plusieurs outils', async () => {
    const tools = await updateTools([1, 2, 3], { status: 'archived' })
    expect(tools.filter((t) => t.status === 'archived').map((t) => t.id)).toEqual([1, 2, 3])
  })

  it('deleteTools supprime définitivement', async () => {
    const tools = await deleteTools([1, 2])
    expect(tools).toHaveLength(18)
    expect(tools.some((t) => t.id === 1)).toBe(false)
  })

  describe('erreurs simulées', () => {
    it('?mock=error fait échouer la lecture', async () => {
      window.history.replaceState({}, '', '/?mock=error')
      await expect(listTools()).rejects.toMatchObject({ kind: 'server' })
    })

    it('?mock=write-error fait échouer les écritures mais pas la lecture', async () => {
      window.history.replaceState({}, '', '/?mock=write-error')
      await expect(listTools()).resolves.toHaveLength(20)
      await expect(createTool(input())).rejects.toMatchObject({ kind: 'server' })
      await expect(updateTools([1], { status: 'disabled' })).rejects.toMatchObject({ kind: 'server' })
    })
  })
})
