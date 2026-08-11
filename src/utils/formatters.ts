export const fmt = new Intl.NumberFormat('en-US')
export const money = (value: number) => `$${fmt.format(value)}`
export const compact = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
