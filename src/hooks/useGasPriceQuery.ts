import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'

export type GasPrice = {
  price: number
  period: string
  area: string
  scope: 'metro' | 'state' | 'region'
  units: 'USD per gallon'
  source: string
  sourceUrl: string
}

export const gasPricePeriodLabel = (period: string) =>
  new Date(`${period}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

export const useGasPriceQuery = (city: City) =>
  useQuery({
    queryKey: ['gas-price', city.name, city.state],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ city: city.name, state: city.state })
      const response = await fetch(`/api/gas-price?${params}`, { signal })
      if (!response.ok) throw new Error('Regular gas price unavailable')
      return (await response.json()) as GasPrice
    },
    staleTime: 6 * 60 * 60 * 1000,
    retry: false,
  })
