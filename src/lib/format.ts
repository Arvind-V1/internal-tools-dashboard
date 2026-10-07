const numberFormat = new Intl.NumberFormat('en-US')

export const formatNumber = (value: number) => numberFormat.format(value)

export const formatEuro = (value: number) => `€${numberFormat.format(value)}`

export const formatEuroCompact = (value: number) =>
  value >= 1000 && value % 1000 === 0 ? `€${value / 1000}k` : formatEuro(value)
