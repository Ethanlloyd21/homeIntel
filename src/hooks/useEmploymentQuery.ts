import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchEmploymentData } from 'services/employment'

export const useEmploymentQuery = (
  city: City,
  enabled = true,
  includeDetails = true,
) => {
  return useQuery({
    queryKey: ['employment-industry-groups-v8', city.id, includeDetails],
    queryFn: ({ signal }) => fetchEmploymentData(city, signal, includeDetails),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
