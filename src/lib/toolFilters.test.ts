import { buildSeedTools } from '../data/mock'
import { applyFilters, countActiveFilters, EMPTY_FILTERS, matchesQuery, parseFilters, writeFilters, type ToolFilters } from './toolFilters'

const tools = buildSeedTools(Date.parse('2026-10-10T12:00:00Z'))
const names = (list: typeof tools) => list.map((t) => t.name)
const withFilters = (patch: Partial<ToolFilters>) => ({ ...EMPTY_FILTERS, ...patch })

describe('parseFilters / writeFilters (URL)', () => {
  it('lit les filtres depuis l\'URL', () => {
    const filters = parseFilters(new URLSearchParams('department=Design&category=Design&status=expiring,active&min=100&max=900'))
    expect(filters).toEqual({ department: 'Design', category: 'Design', statuses: ['active', 'expiring'], min: 100, max: 900 })
  })

  it('ignore les valeurs invalides', () => {
    const filters = parseFilters(new URLSearchParams('status=foo,unused&min=abc&max=-5'))
    expect(filters).toEqual({ ...EMPTY_FILTERS, statuses: ['unused'] })
  })

  it('écrit uniquement les filtres actifs, sans toucher aux autres paramètres', () => {
    const params = new URLSearchParams('q=slack&department=Sales')
    writeFilters(params, withFilters({ category: 'Design', statuses: ['active', 'unused'], min: 50 }))
    expect(params.toString()).toBe('q=slack&category=Design&status=active%2Cunused&min=50')
  })
})

describe('applyFilters', () => {
  it('masque les outils archivés par défaut', () => {
    const list = tools.map((t) => (t.name === 'Slack' ? { ...t, status: 'archived' as const } : t))
    expect(names(applyFilters(list, EMPTY_FILTERS, ''))).not.toContain('Slack')
    expect(names(applyFilters(list, withFilters({ statuses: ['archived'] }), ''))).toEqual(['Slack'])
  })

  it('combine département, catégorie, statut et budget', () => {
    expect(names(applyFilters(tools, withFilters({ department: 'Design' }), ''))).toEqual(['Figma', 'Miro'])
    expect(names(applyFilters(tools, withFilters({ category: 'Design', statuses: ['unused'] }), ''))).toEqual(['Adobe CC'])
    expect(names(applyFilters(tools, withFilters({ min: 2000 }), ''))).toEqual(['Slack', 'Salesforce', 'Microsoft 365'])
  })

  it('les bornes de coût sont incluses', () => {
    expect(names(applyFilters(tools, withFilters({ min: 480, max: 480 }), ''))).toEqual(['Figma'])
  })

  it('accepte plusieurs statuts', () => {
    const result = applyFilters(tools, withFilters({ statuses: ['unused', 'disabled'] }), '')
    expect(names(result)).toEqual(['Adobe CC', 'Asana', 'Mailchimp', 'Zendesk'])
  })

  it('combine filtres et recherche', () => {
    expect(names(applyFilters(tools, withFilters({ department: 'Engineering' }), 'monitoring'))).toEqual(['Datadog'])
  })
})

describe('matchesQuery (recherche multi-critères)', () => {
  const [slack] = tools

  it('cherche dans le nom, la description, l\'éditeur, la catégorie, le département et le statut', () => {
    for (const query of ['slack', 'messaging', 'technologies', 'communication', 'active']) {
      expect(matchesQuery(slack, query)).toBe(true)
    }
  })

  it('tous les mots doivent correspondre, dans n\'importe quel ordre', () => {
    expect(matchesQuery(slack, 'active messaging')).toBe(true)
    expect(matchesQuery(slack, 'messaging unused')).toBe(false)
  })

  it('une recherche vide correspond à tout', () => {
    expect(matchesQuery(slack, '   ')).toBe(true)
  })
})

describe('countActiveFilters', () => {
  it('compte chaque critère actif', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
    expect(countActiveFilters(withFilters({ department: 'Sales', statuses: ['active'], min: 0 }))).toBe(3)
  })
})
