import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/tools', 'Tools'],
    ['/analytics', 'Analytics'],
    ['/inconnu', 'Dashboard'],
  ])('affiche la bonne page sur %s', (path, title) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })
})