import { useQuery } from '@tanstack/react-query'
import type { City } from '../data/cities'
import { fetchMajorEmployers } from '../services/employers'

export function useMajorEmployersQuery(city: City, enabled = true) {
  return useQuery({
    queryKey: ['major-employers', 'distances-v1', city.id],
    queryFn: ({ signal }) => fetchMajorEmployers(city, signal),
    enabled,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })
}
