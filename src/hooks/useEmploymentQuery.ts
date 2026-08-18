import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchEmploymentData } from 'services/employment'

export const useEmploymentQuery = (city: City, enabled = true) => {
  return useQuery({
    queryKey: ['employment', city.id],
    queryFn: ({ signal }) => fetchEmploymentData(city, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
