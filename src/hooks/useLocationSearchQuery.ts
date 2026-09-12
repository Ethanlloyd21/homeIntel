import { useQuery } from '@tanstack/react-query'
import type { GeocodingResult } from 'data/cities'

type GeocodingResponse = {
  results?: GeocodingResult[]
}

const fetchLocations = async (
  search: string,
  signal: AbortSignal,
  countryCode?: string,
) => {
  const params = new URLSearchParams({
    name: search,
    count: '8',
    language: 'en',
    format: 'json',
  })
  if (countryCode) params.set('countryCode', countryCode)
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    { signal },
  )
  if (!response.ok) throw new Error('Location search failed')
  const data = (await response.json()) as GeocodingResponse
  return (data.results ?? []).filter(
    (result) => !countryCode || result.country_code === countryCode,
  )
}

export const useLocationSearchQuery = (
  search: string,
  countryCode?: string,
) => {
  return useQuery({
    queryKey: ['locations', search.toLowerCase(), countryCode ?? 'all'],
    enabled: search.length >= 2,
    queryFn: ({ signal }) => fetchLocations(search, signal, countryCode),
    staleTime: 60 * 60 * 1000,
  })
}
