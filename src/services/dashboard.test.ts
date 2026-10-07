import { DashboardError, fetchDashboard, mapApiTool } from './dashboard'

const apiTool = {
  id: 7,
  name: 'Slack',
  category: 'Communication',
  monthly_cost: 8,
  total_monthly_cost: 200,
  owner_department: 'Engineering',
  status: 'active' as const,
  active_users_count: 25,
}

describe('mapApiTool', () => {
  it('convertit un outil de l\'API', () => {
    expect(mapApiTool(apiTool)).toEqual({
      id: 7, name: 'Slack', icon: '💬', department: 'Engineering', users: 25, monthlyCost: 200, status: 'active',
    })
  })

  it('calcule le coût total si l\'API ne le fournit pas, et choisit une icône par catégorie', () => {
    const tool = mapApiTool({ ...apiTool, name: 'Sketch', category: 'Design', total_monthly_cost: undefined })
    expect(tool.monthlyCost).toBe(200)
    expect(tool.icon).toBe('🎨')
  })

  it('utilise une icône par défaut pour une catégorie inconnue', () => {
    expect(mapApiTool({ ...apiTool, name: 'Foo', category: 'Other' }).icon).toBe('🧩')
  })
})

describe('fetchDashboard', () => {
  it('mode mockup : renvoie les données du mockup', async () => {
    const data = await fetchDashboard()
    expect(data.tools).toHaveLength(8)
    expect(data.kpis.map((k) => k.value)).toEqual([28750, 147, 8, 156])
  })

  it('mode mockup : simule une erreur serveur avec ?mock=error', async () => {
    window.history.replaceState({}, '', '/?mock=error')
    await expect(fetchDashboard()).rejects.toMatchObject({ kind: 'server' })
  })

  describe('mode API', () => {
    beforeEach(() => vi.stubEnv('VITE_DATA_SOURCE', 'api'))

    it('charge les outils et calcule les KPIs', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [apiTool] }) })
      vi.stubGlobal('fetch', fetchMock)

      const data = await fetchDashboard()

      expect(fetchMock).toHaveBeenCalledWith('/api/tools?limit=100')
      expect(data.tools).toHaveLength(1)
      expect(data.kpis[0].value).toBe(200)
    })

    it('API injoignable : erreur de type "network"', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
      await expect(fetchDashboard()).rejects.toMatchObject({ kind: 'network' })
    })

    it('réponse 500 : erreur de type "server"', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
      const error = await fetchDashboard().catch((e: unknown) => e)
      expect(error).toBeInstanceOf(DashboardError)
      expect(error).toMatchObject({ kind: 'server' })
    })
  })
})
