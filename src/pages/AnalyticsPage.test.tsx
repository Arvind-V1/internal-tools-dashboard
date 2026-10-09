import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test/utils'
import AnalyticsPage from './AnalyticsPage'

const exportExcel = vi.hoisted(() => vi.fn())
vi.mock('../services/exportReport', () => ({ exportExcel, exportPdf: vi.fn() }))

const renderPage = (route = '/analytics') =>
  renderWithProviders(
    <Routes>
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/tools" element={<p>Tools page</p>} />
    </Routes>,
    route,
  )

const loaded = () => screen.findByRole('region', { name: 'Cost metrics' })
const location = () => screen.getByTestId('location').textContent

describe('AnalyticsPage', () => {
  beforeEach(() => exportExcel.mockReset())

  it('affiche un squelette puis les trois sections', async () => {
    renderPage()
    expect(screen.getByLabelText('Loading analytics')).toBeInTheDocument()
    await loaded()

    expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument()
    for (const name of ['Cost Analytics', 'Usage Analytics', 'Insights']) expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    for (const name of ['Monthly Spend Evolution', 'Department Cost Breakdown', 'Top Expensive Tools', 'User Adoption Rates', 'Most Used Tools', 'Least Used Tools', 'Department Activity', 'Growth Trends', 'Usage Patterns', 'Cost Optimization Alerts']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('progressbar', { name: 'Budget used' })).toBeInTheDocument()
  })

  it('affiche l\'erreur contextuelle et permet de réessayer', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/analytics?mock=error')
    renderPage('/analytics?mock=error')
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load your tools')
    window.history.replaceState({}, '', '/')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await loaded()
  })

  it('le sélecteur de plage met à jour l\'URL (90d est la valeur par défaut)', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    expect(screen.getByRole('radio', { name: 'Last 90 days' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Last 12 months' }))
    expect(location()).toBe('/analytics?range=1y')
    expect(screen.getByRole('radio', { name: 'Last 12 months' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Last 90 days' }))
    expect(location()).toBe('/analytics')
  })

  it('drill-down : un clic sur un département restreint toute la page, un second clic annule', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.click(within(screen.getByRole('list', { name: 'Adoption by department' })).getByRole('button', { name: /Design/ }))
    expect(location()).toBe('/analytics?department=Design')
    expect(screen.getByLabelText('Department')).toHaveValue('Design')
    expect(screen.getByRole('heading', { name: 'Design · Cost by Tool' })).toBeInTheDocument()
    expect(screen.getByText('Scope Spend')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Cost metrics' })).getByText('€1,056')).toBeInTheDocument() // Figma 480 + Miro 576

    await user.click(within(screen.getByRole('list', { name: 'Adoption by department' })).getByRole('button', { name: /Design/ }))
    expect(location()).toBe('/analytics')
    expect(screen.getByRole('heading', { name: 'Department Cost Breakdown' })).toBeInTheDocument()
  })

  it('filtre par catégorie, et « Clear filters » remet tout à zéro', async () => {
    const user = userEvent.setup()
    renderPage('/analytics?department=Sales&category=Security')
    expect(await screen.findByText('No tools match your selection')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
    expect(location()).toBe('/analytics')
    await loaded()
  })

  it('la recherche du header filtre les métriques', async () => {
    renderPage('/analytics?q=figma')
    await loaded()
    const table = screen.getByRole('table', { name: 'User adoption by tool' })
    expect(within(table).getByText('Figma')).toBeInTheDocument()
    expect(within(table).queryByText('Slack')).not.toBeInTheDocument()
  })

  it('clic sur un outil du classement : lien profond vers la fiche dans la page Tools', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const link = within(screen.getByRole('list', { name: 'Most expensive tools' })).getByRole('link', { name: /Salesforce/ })
    expect(link).toHaveAttribute('href', '/tools?view=8')
    await user.click(link)
    expect(location()).toBe('/tools?view=8')
  })

  it('affiche des alertes d\'optimisation avec lien vers l\'outil et économies', async () => {
    renderPage()
    await loaded()
    expect(screen.getAllByText(/Save ≈ €/).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /View tool|Open catalog/ }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Back to Dashboard/ })).toHaveAttribute('href', '/')
  })

  it('export Excel : appelle le service et confirme par un toast', async () => {
    const user = userEvent.setup()
    exportExcel.mockResolvedValue('analytics-90d.xlsx')
    renderPage()
    await loaded()

    await user.click(screen.getByRole('button', { name: 'Export report' }))
    await user.click(screen.getByRole('menuitem', { name: 'Excel (.xlsx)' }))

    await waitFor(() => expect(exportExcel).toHaveBeenCalledTimes(1))
    expect(exportExcel.mock.calls[0][1]).toMatchObject({ range: '90d', department: '', category: '' })
    expect(await screen.findByText('analytics-90d.xlsx downloaded')).toBeInTheDocument()
  })

  it('mode Live : l\'interrupteur et le rafraîchissement manuel mettent à jour l\'heure', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const toggle = screen.getByRole('switch', { name: /Live/ })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
    expect(screen.getByText(/^Live · Last updated/)).toBeInTheDocument()

    await act(async () => { await user.click(screen.getByRole('button', { name: 'Refresh data' })) })
    expect(screen.getByText(/Last updated \d\d:\d\d:\d\d/)).toBeInTheDocument()
  })

  it('l\'infobulle du graphique de dépenses suit le clavier', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    screen.getByRole('img', { name: /^Monthly spend:/ }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getAllByRole('status').some((el) => /Monthly spend/.test(el.textContent ?? ''))).toBe(true)
  })
})
