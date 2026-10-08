import { buildSeedTools } from '../data/mock'
import { buildRecommendations, potentialSavings } from './recommendations'

const tools = buildSeedTools(Date.parse('2026-10-10T12:00:00Z'))

describe('buildRecommendations', () => {
  it('propose un conseil de chaque type à partir du catalogue', () => {
    const recs = buildRecommendations(tools)

    expect(recs.map((r) => r.kind)).toEqual(['unused', 'expiring', 'overlap', 'cost'])
    expect(recs[0]).toMatchObject({ title: 'Adobe CC looks unused', action: { type: 'archive', toolId: 5 } })
    expect(recs[1]).toMatchObject({ title: 'Notion is about to expire', action: { type: 'view' } })
    expect(recs[2]).toMatchObject({ title: '5 tools overlap in Productivity', action: { type: 'filter-category', category: 'Productivity' } })
    expect(recs[3].title).toBe('Salesforce costs €100 per user')
  })

  it('respecte la limite demandée', () => {
    expect(buildRecommendations(tools, 2)).toHaveLength(2)
  })

  it('ignore les outils désactivés ou archivés', () => {
    const quiet = tools.map((t) => (t.status === 'unused' ? { ...t, status: 'archived' as const } : t))
    expect(buildRecommendations(quiet).map((r) => r.kind)).not.toContain('unused')
  })

  it('ne propose rien quand tout va bien', () => {
    const healthy = tools.filter((t) => t.status === 'active' && t.category !== 'Productivity' && t.name !== 'Salesforce').slice(0, 4)
    expect(buildRecommendations(healthy)).toEqual([])
  })
})

describe('potentialSavings', () => {
  it('additionne le coût des outils inutilisés', () => {
    expect(potentialSavings(tools)).toBe(720 + 264 + 299)
    expect(potentialSavings([])).toBe(0)
  })
})
