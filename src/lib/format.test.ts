import { formatEuro, formatEuroCompact, formatNumber, formatRelative } from './format'

describe('format', () => {
  it('formate les euros avec séparateur de milliers', () => {
    expect(formatEuro(28750)).toBe('€28,750')
    expect(formatEuro(156)).toBe('€156')
  })

  it('abrège les montants ronds en milliers', () => {
    expect(formatEuroCompact(30000)).toBe('€30k')
    expect(formatEuroCompact(28750)).toBe('€28,750')
    expect(formatEuroCompact(500)).toBe('€500')
  })

  it('formate les nombres', () => {
    expect(formatNumber(1980)).toBe('1,980')
  })
})

describe('formatRelative', () => {
  const now = Date.parse('2026-10-10T12:00:00Z')
  const ago = (days: number) => new Date(now - days * 86_400_000).toISOString()

  it.each([
    [0, 'today'],
    [1, 'yesterday'],
    [3, '3 days ago'],
    [7, '1 week ago'],
    [15, '2 weeks ago'],
    [45, '1 month ago'],
    [400, '1 year ago'],
  ])('il y a %i jours -> %s', (days, expected) => {
    expect(formatRelative(ago(days), now)).toBe(expected)
  })
})
