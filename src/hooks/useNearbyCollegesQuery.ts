import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchNearbyColleges } from 'services/colleges'

export const useNearbyCollegesQuery = (city: City, enabled = true) => {
  return useQuery({
    queryKey: ['nearby-colleges', city.id],
    queryFn: ({ signal }) => fetchNearbyColleges(city, signal),
    enabled,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })
}
