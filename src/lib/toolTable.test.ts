import { makeTools } from '../test/utils'
import { filterTools, nextSort, paginate, sortTools } from './toolTable'

describe('filterTools', () => {
  const tools = makeTools(6)

  it('renvoie tout sans recherche', () => {
    expect(filterTools(tools, '  ')).toHaveLength(6)
  })

  it('cherche sans tenir compte de la casse, dans le nom, le département et le statut', () => {
    expect(filterTools(tools, 'tool 03').map((t) => t.id)).toEqual([3])
    expect(filterTools(tools, 'SALES')).toHaveLength(3)
    expect(filterTools(tools, 'expiring').every((t) => t.status === 'expiring')).toBe(true)
  })

  it('renvoie une liste vide quand rien ne correspond', () => {
    expect(filterTools(tools, 'zzz')).toEqual([])
  })
})

describe('sortTools', () => {
  const tools = makeTools(4) // coûts décroissants : 400, 300, 200, 100

  it('garde l\'ordre d\'origine sans tri', () => {
    expect(sortTools(tools, null)).toBe(tools)
  })

  it('trie les nombres numériquement', () => {
    expect(sortTools(tools, { key: 'monthlyCost', dir: 'asc' }).map((t) => t.monthlyCost)).toEqual([100, 200, 300, 400])
    expect(sortTools(tools, { key: 'users', dir: 'desc' }).map((t) => t.users)).toEqual([40, 30, 20, 10])
  })

  it('trie les textes alphabétiquement', () => {
    expect(sortTools(tools, { key: 'name', dir: 'desc' })[0].name).toBe('Tool 04')
  })

  it('ne modifie pas le tableau d\'origine', () => {
    const copy = [...tools]
    sortTools(tools, { key: 'monthlyCost', dir: 'asc' })
    expect(tools).toEqual(copy)
  })
})

describe('nextSort', () => {
  it('enchaîne croissant, décroissant, puis retour à l\'ordre d\'origine', () => {
    const asc = nextSort(null, 'name')
    expect(asc).toEqual({ key: 'name', dir: 'asc' })
    const desc = nextSort(asc, 'name')
    expect(desc).toEqual({ key: 'name', dir: 'desc' })
    expect(nextSort(desc, 'name')).toBeNull()
  })

  it('repart en croissant quand on change de colonne', () => {
    expect(nextSort({ key: 'name', dir: 'desc' }, 'users')).toEqual({ key: 'users', dir: 'asc' })
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)

  it('découpe par pages de 10', () => {
    expect(paginate(items, 1)).toMatchObject({ items: items.slice(0, 10), totalPages: 3, page: 1, start: 0 })
    expect(paginate(items, 3).items).toEqual([21, 22, 23])
  })

  it('ramène la page demandée dans les bornes', () => {
    expect(paginate(items, 99).page).toBe(3)
    expect(paginate(items, 0).page).toBe(1)
  })

  it('gère une liste vide', () => {
    expect(paginate([], 1)).toMatchObject({ items: [], totalPages: 1, page: 1 })
  })
})
