import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
export type TrafficSummary = {
  sampleCount: number
  delayPercent: number
  closedRoads: number
  updatedAt: string
  scope: string
}
export const useTrafficSummaryQuery = (city: City) =>
  useQuery({
    queryKey: ['traffic-summary', city.latitude, city.longitude],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        lat: String(city.latitude),
        lon: String(city.longitude),
      })
      const response = await fetch(`/api/traffic-summary?${params}`, { signal })
      if (!response.ok) throw new Error('Current traffic summary unavailable')
      return (await response.json()) as TrafficSummary
    },
    staleTime: 120000,
    refetchInterval: 120000,
    retry: false,
  })
