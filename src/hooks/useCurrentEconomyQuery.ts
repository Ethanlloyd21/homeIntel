import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchCurrentEconomy } from 'services/currentEconomy'

export const useCurrentEconomyQuery = (city: City, enabled = true) => {
  return useQuery({
    queryKey: ['current-economy', 'laus-fallback-v2', city.id],
    queryFn: ({ signal }) => fetchCurrentEconomy(city, signal),
    enabled,
    staleTime: 6 * 60 * 60 * 1000,
  })
}
