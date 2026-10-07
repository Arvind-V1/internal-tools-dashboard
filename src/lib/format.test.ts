import { formatEuro, formatEuroCompact, formatNumber } from './format'

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
