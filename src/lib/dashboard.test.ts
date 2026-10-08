import { makeTools } from '../test/utils'
import { buildNotifications } from './dashboard'

describe('buildNotifications', () => {
  it('crée une notification par outil expiré ou inutilisé', () => {
    const notifications = buildNotifications(makeTools(6))

    expect(notifications).toHaveLength(4)
    expect(notifications[0].title).toBe('Tool 02 license expiring')
    expect(notifications[1].title).toBe('Tool 03 looks unused')
  })

  it('ignore les outils actifs, désactivés ou archivés', () => {
    const tools = makeTools(3).map((t) => ({ ...t, status: 'disabled' as const }))
    expect(buildNotifications(tools)).toEqual([])
  })
})
