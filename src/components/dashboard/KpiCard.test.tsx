import { render, screen } from '@testing-library/react'
import { mockKpis } from '../../data/mock'
import { KpiGrid, KpiGridSkeleton } from './KpiGrid'

describe('KpiGrid', () => {
  it('affiche les 4 KPIs du mockup', () => {
    render(<KpiGrid kpis={mockKpis} />)

    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
    expect(screen.getByText('€28,750')).toBeInTheDocument()
    expect(screen.getByText('/€30k')).toBeInTheDocument()
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('147')).toBeInTheDocument()
    expect(screen.getByText('€156')).toBeInTheDocument()
    expect(screen.getByText('-€12')).toBeInTheDocument()
  })

  it('n\'affiche ni objectif ni badge quand ils ne sont pas fournis', () => {
    render(<KpiGrid kpis={[{ id: 'x', label: 'Departments', value: 8, format: 'number', trend: null, tone: 'orange', icon: 'departments' }]} />)

    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
  })

  it('le squelette reproduit 4 cartes et signale le chargement', () => {
    render(<KpiGridSkeleton />)
    expect(screen.getByLabelText('Loading key metrics')).toHaveAttribute('aria-busy', 'true')
  })
})
