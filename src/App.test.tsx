import { screen } from '@testing-library/react'
import { renderWithProviders } from './test/utils'
import App from './App'

describe('App', () => {
  it.each([
    ['/', 'Internal Tools Dashboard'],
    ['/tools', 'Tools Catalog'],
    ['/analytics', 'Analytics'],
    ['/settings', 'Settings'],
    ['/inconnu', 'Internal Tools Dashboard'],
  ])('affiche la bonne page sur %s', async (path, title) => {
    renderWithProviders(<App />, path)

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('garde le header sur toutes les pages', () => {
    renderWithProviders(<App />, '/analytics')
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
  })
})
