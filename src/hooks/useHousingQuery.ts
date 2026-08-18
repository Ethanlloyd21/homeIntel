import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchHousingData } from 'services/housing'

export const useHousingQuery = (city: City, enabled = true) => {
  return useQuery({
    queryKey: ['housing', city.id],
    queryFn: ({ signal }) => fetchHousingData(city, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
