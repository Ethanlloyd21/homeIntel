import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchComparisonIndices } from 'services/comparisonIndices'

export const useComparisonIndicesQuery = (city: City, enabled = true) => {
  return useQuery({
    queryKey: ['comparison-indices', city.id],
    queryFn: ({ signal }) => fetchComparisonIndices(city, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
