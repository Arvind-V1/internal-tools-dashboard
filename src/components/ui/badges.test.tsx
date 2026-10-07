import { render, screen } from '@testing-library/react'
import { TrendBadge } from './TrendBadge'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['active', 'Active', 'from-emerald-500'],
    ['expiring', 'Expiring', 'from-amber-500'],
    ['unused', 'Unused', 'from-red-500'],
  ] as const)('%s : libellé et couleur', (status, label, colorClass) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveClass(colorClass)
  })
})

describe('TrendBadge', () => {
  it('affiche la tendance', () => {
    render(<TrendBadge tone="pink">-€12</TrendBadge>)
    expect(screen.getByText('-€12')).toHaveClass('from-pink-500')
  })
})
