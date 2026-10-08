import { buildSeedTools } from '../data/mock'
import { costPerUser, isLive, recentTools, statusActions } from './tools'

const NOW = Date.parse('2026-10-10T12:00:00Z')
const seed = () => buildSeedTools(NOW)

describe('recentTools', () => {
  it('garde les outils modifiés ces 30 derniers jours, du plus récent au plus ancien', () => {
    const recent = recentTools(seed(), NOW)
    expect(recent.map((t) => t.name)).toEqual(['Slack', 'Figma', 'GitHub', 'Notion', 'Adobe CC', 'Zoom', 'Jira', 'Salesforce'])
  })

  it('exclut les outils archivés', () => {
    const tools = seed().map((t) => (t.name === 'Slack' ? { ...t, status: 'archived' as const } : t))
    expect(recentTools(tools, NOW).map((t) => t.name)).not.toContain('Slack')
  })
})

describe('statusActions (workflow de statut)', () => {
  const tool = seed()[0]

  it('actif ou en fin de contrat : désactiver ou archiver', () => {
    expect(statusActions({ ...tool, status: 'active' }).map((a) => a.kind)).toEqual(['disable', 'archive'])
    expect(statusActions({ ...tool, status: 'expiring' }).map((a) => a.kind)).toEqual(['disable', 'archive'])
  })

  it('désactivé : activer ou archiver', () => {
    expect(statusActions({ ...tool, status: 'disabled' })).toEqual([
      { kind: 'enable', label: 'Enable', next: 'active' },
      { kind: 'archive', label: 'Archive', next: 'archived' },
    ])
  })

  it('archivé : restaurer uniquement', () => {
    expect(statusActions({ ...tool, status: 'archived' })).toEqual([{ kind: 'restore', label: 'Restore', next: 'active' }])
  })
})

describe('helpers', () => {
  const [slack] = seed()

  it('calcule le coût par utilisateur (et gère 0 utilisateur)', () => {
    expect(costPerUser(slack)).toBe(10)
    expect(costPerUser({ ...slack, users: 0 })).toBe(2450)
  })

  it('un outil désactivé ou archivé n\'est plus "en service"', () => {
    expect(isLive(slack)).toBe(true)
    expect(isLive({ ...slack, status: 'disabled' })).toBe(false)
    expect(isLive({ ...slack, status: 'archived' })).toBe(false)
  })
})
