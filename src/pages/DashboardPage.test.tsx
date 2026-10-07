import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test/utils'
import DashboardPage from './DashboardPage'

const renderPage = (route = '/') =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tools" element={<p>Tools page</p>} />
    </Routes>,
    route,
  )

const rows = () => screen.getAllByRole('row').slice(1)

describe('DashboardPage', () => {
  it('affiche des squelettes pendant le chargement puis les données', async () => {
    renderPage()

    expect(screen.getByLabelText('Loading key metrics')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading recent tools')).toBeInTheDocument()

    expect(await screen.findByText('€28,750')).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading key metrics')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Internal Tools Dashboard' })).toBeInTheDocument()
    expect(rows()).toHaveLength(8)
    expect(screen.getByText('Salesforce')).toBeInTheDocument()
  })

  it('affiche une erreur contextuelle et permet de réessayer', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/?mock=error')
    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Unable to load dashboard data')

    window.history.replaceState({}, '', '/') // le serveur "revient"
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('€28,750')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('filtre le tableau avec ?q= (recherche du header)', async () => {
    renderPage('/?q=engineering')

    await screen.findByText('€28,750')
    expect(rows().map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(expect.arrayContaining([expect.stringContaining('GitHub'), expect.stringContaining('Jira')]))
    expect(rows()).toHaveLength(2)
  })

  it('"Clear search" retire le filtre', async () => {
    const user = userEvent.setup()
    renderPage('/?q=zzz')

    await user.click(await screen.findByRole('button', { name: 'Clear search' }))

    await waitFor(() => expect(rows()).toHaveLength(8))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
  })

  it('supprime un outil après confirmation', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    await screen.findByText('€28,750')

    await user.click(screen.getByRole('button', { name: 'Actions for Zoom' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(confirm).toHaveBeenCalledWith('Delete Zoom?')
    expect(screen.queryByText('Zoom')).not.toBeInTheDocument()
    expect(rows()).toHaveLength(7)
  })

  it('garde l\'outil si la suppression est annulée', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    await screen.findByText('€28,750')

    await user.click(screen.getByRole('button', { name: 'Actions for Zoom' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(rows()).toHaveLength(8)
  })

  it('"View" ouvre la page Tools sur l\'outil choisi', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('€28,750')

    await user.click(screen.getByRole('button', { name: 'Actions for Figma' }))
    await user.click(screen.getByRole('menuitem', { name: 'View' }))

    expect(screen.getByText('Tools page')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tools?view=2')
  })
})
