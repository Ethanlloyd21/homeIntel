import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchDemographics } from 'services/demographics'

export const useDemographicsQuery = (
  city: City,
  enabled = true,
  includeDetails = true,
) => {
  return useQuery({
    queryKey: [
      'demographics',
      'education-comparison-v2',
      city.id,
      includeDetails,
    ],
    queryFn: ({ signal }) => fetchDemographics(city, signal, includeDetails),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
