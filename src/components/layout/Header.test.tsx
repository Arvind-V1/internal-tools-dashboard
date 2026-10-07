import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { Header } from './Header'
import { renderWithProviders } from '../../test/utils'

function renderHeader(route = '/') {
  return renderWithProviders(
    <>
      <Header />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </>,
    route,
  )
}

describe('Header', () => {
  it('affiche le logo et la navigation', () => {
    renderHeader()

    expect(screen.getByText('TechCorp')).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]
    expect(nav.textContent).toBe('DashboardToolsAnalyticsSettings')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  it('marque la page courante comme active', () => {
    renderHeader('/analytics')
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('affiche le badge de notifications avec le compteur une fois les données chargées', async () => {
    const user = userEvent.setup()
    renderHeader()

    expect(await screen.findByTestId('notifications-badge')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Notifications, 3 unread' }))

    expect(screen.getByText('(3)')).toBeInTheDocument()
    expect(screen.getByText('Notion license expiring')).toBeInTheDocument()
    expect(screen.getByText('Adobe CC looks unused')).toBeInTheDocument()
  })

  it('bascule entre thème sombre et clair, et mémorise le choix', async () => {
    const user = userEvent.setup()
    renderHeader()
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('utilise le thème mémorisé', () => {
    localStorage.setItem('theme', 'light')
    renderHeader()
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('ouvre et ferme le menu hamburger', async () => {
    const user = userEvent.setup()
    renderHeader()
    const burger = screen.getByRole('button', { name: 'Open menu' })
    expect(burger).toHaveAttribute('aria-expanded', 'false')

    await user.click(burger)
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('mobile-nav')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(document.getElementById('mobile-nav')).not.toBeInTheDocument()
  })

  it('ferme le menu mobile après un clic sur un lien', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    const mobileNav = within(document.getElementById('mobile-nav')!)
    await user.click(mobileNav.getByRole('link', { name: 'Tools' }))

    expect(document.getElementById('mobile-nav')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tools')
  })

  it('la recherche alimente l\'URL (?q=) et s\'efface avec Échap', async () => {
    const user = userEvent.setup()
    renderHeader()
    const search = screen.getAllByRole('searchbox')[0]

    await user.type(search, 'figma')
    expect(screen.getByTestId('location')).toHaveTextContent('/?q=figma')

    await user.keyboard('{Escape}')
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
  })

  it('adapte le placeholder de la recherche à la page', () => {
    renderHeader('/analytics')
    expect(screen.getAllByRole('searchbox')[0]).toHaveAttribute('placeholder', 'Search metrics...')
  })

  it('ouvre le menu utilisateur', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'User menu' }))

    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Profile', 'Settings', 'Sign out'])
  })
})
