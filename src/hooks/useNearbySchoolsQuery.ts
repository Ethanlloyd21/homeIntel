import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchNearbySchools } from 'services/schools'

export const useNearbySchoolsQuery = (city: City, enabled = true) => {
  return useQuery({
    queryKey: ['nearby-schools', city.id],
    queryFn: ({ signal }) => fetchNearbySchools(city, signal),
    enabled,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })
}
