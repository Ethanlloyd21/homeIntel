import { useQuery } from '@tanstack/react-query'
import type { GeocodingResult } from '../data/cities'

type GeocodingResponse = {
  results?: GeocodingResult[]
}

async function fetchLocations(search: string, signal: AbortSignal) {
  const params = new URLSearchParams({
    name: search,
    count: '8',
    language: 'en',
    format: 'json',
  })
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    { signal },
  )
  if (!response.ok) throw new Error('Location search failed')
  const data = (await response.json()) as GeocodingResponse
  return data.results ?? []
}

export function useLocationSearchQuery(search: string) {
  return useQuery({
    queryKey: ['locations', search.toLowerCase()],
    enabled: search.length >= 2,
    queryFn: ({ signal }) => fetchLocations(search, signal),
    staleTime: 60 * 60 * 1000,
  })
}
