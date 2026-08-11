import { useQuery } from '@tanstack/react-query'
import type { City } from '../data/cities'
import { fetchRiskData } from '../services/risk'

export function useRiskQuery(city: City, enabled = true) {
  return useQuery({
    queryKey: ['risk', city.id],
    queryFn: ({ signal }) => fetchRiskData(city, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
