import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import type { RiskData } from 'services/risk'
import type { StormArea } from 'utils/stormHistory'
export type StormHistory = {
  startYear: number
  endYear: number
  county: StormArea | null
  zone: StormArea | null
  zoneId: string | null
  zoneUnavailable: boolean
}
export const useStormHistoryQuery = (city: City, risk: RiskData | undefined) =>
  useQuery({
    queryKey: [
      'storm-history-v1',
      risk?.countyFips,
      city.latitude,
      city.longitude,
    ],
    enabled: Boolean(risk?.countyFips),
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async ({ signal }): Promise<StormHistory> => {
      const [data, point] = await Promise.all([
        fetch(`/data/storm-history/${risk!.countyFips.slice(0, 2)}.json`, {
          signal,
        }).then(async (r) => {
          if (!r.ok) throw new Error('NOAA history is unavailable')
          return (await r.json()) as {
            startYear: number
            endYear: number
            areas: Record<string, StormArea>
          }
        }),
        fetch(
          `https://api.weather.gov/points/${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}`,
          { signal, headers: { Accept: 'application/geo+json' } },
        )
          .then(async (r) =>
            r.ok
              ? ((await r.json()) as { properties?: { forecastZone?: string } })
              : null,
          )
          .catch(() => null),
      ])
      if (signal.aborted) throw signal.reason
      const zoneId = point?.properties?.forecastZone?.split('/').at(-1) ?? null
      const zoneKey = zoneId?.match(/^[A-Z]{2}Z(\d{3})$/)?.[1]
      return {
        startYear: data.startYear,
        endYear: data.endYear,
        county: data.areas[`C${risk!.countyFips.slice(2)}`] ?? null,
        zone: zoneKey ? (data.areas[`Z${zoneKey}`] ?? null) : null,
        zoneId,
        zoneUnavailable: !zoneKey,
      }
    },
  })
