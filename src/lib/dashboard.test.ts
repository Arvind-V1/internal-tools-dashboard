import { makeTools } from '../test/utils'
import { buildDashboardFromTools, buildNotifications } from './dashboard'

describe('buildDashboardFromTools', () => {
  const tools = makeTools(6) // statuts : active, expiring, unused (x2) ; départements : Engineering, Sales

  it('calcule les 4 KPIs', () => {
    const { kpis } = buildDashboardFromTools(tools)
    const byId = Object.fromEntries(kpis.map((k) => [k.id, k]))

    expect(byId.budget.value).toBe(2100) // 600+500+400+300+200+100
    expect(byId.budget.target).toBe(30000)
    expect(byId.tools.value).toBe(2) // 2 outils actifs
    expect(byId.departments.value).toBe(2)
    expect(byId['cost-per-user'].value).toBe(Math.round(2100 / 210)) // 210 utilisateurs
  })

  it('ne plante pas sans outil', () => {
    const { kpis } = buildDashboardFromTools([])
    expect(kpis.map((k) => k.value)).toEqual([0, 0, 0, 0])
  })
})

describe('buildNotifications', () => {
  it('crée une notification par outil expiré ou inutilisé', () => {
    const notifications = buildNotifications(makeTools(6))
    expect(notifications).toHaveLength(4)
    expect(notifications[0].title).toBe('Tool 02 license expiring')
    expect(notifications[1].title).toBe('Tool 03 looks unused')
  })
})
