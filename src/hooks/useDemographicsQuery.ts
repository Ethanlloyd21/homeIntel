import { useQuery } from '@tanstack/react-query'
import type { City } from '../data/cities'
import { fetchDemographics } from '../services/demographics'

export function useDemographicsQuery(city: City, enabled = true) {
  return useQuery({
    queryKey: ['demographics', city.id],
    queryFn: ({ signal }) => fetchDemographics(city, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
