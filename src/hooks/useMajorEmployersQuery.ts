import { useQueries } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchMajorEmployers, type EmployerSource } from 'services/employers'

const employerSources: EmployerSource[] = ['USAspending', 'HIFLD', 'Wikidata']

export const useMajorEmployersQuery = (city: City, enabled = true) => {
  const queries = useQueries({
    queries: employerSources.map((source) => ({
      queryKey: ['major-employers', 'progressive-v2', source, city.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchMajorEmployers(city, signal, source),
      enabled,
      staleTime: 7 * 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  })

  return {
    data: queries.flatMap((query) => query.data ?? []),
    isPending: queries.every((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.every((query) => query.isError),
  }
}
