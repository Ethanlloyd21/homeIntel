import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import {
  buildClimateProfile,
  defaultComfortBand,
  type ClimateDailyRecord,
  type ClimateProfile,
  type ComfortBand,
} from 'services/climate'

type ArchiveResponse = {
  daily?: {
    time: string[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_sum: (number | null)[]
    snowfall_sum?: (number | null)[]
    weather_code?: (number | null)[]
    sunrise?: (string | null)[]
    sunset?: (string | null)[]
    daylight_duration?: (number | null)[]
  }
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

/** Years of observed daily weather used to build a climate profile. */
const LOOKBACK_YEARS = 3

const fetchClimateRecords = async (city: City, signal: AbortSignal) => {
  const end = new Date()
  end.setDate(end.getDate() - 7)
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - LOOKBACK_YEARS)

  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'snowfall_sum',
      'weather_code',
      'sunrise',
      'sunset',
      'daylight_duration',
    ].join(','),
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'auto',
    start_date: isoDate(start),
    end_date: isoDate(end),
  })

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`,
    { signal },
  )
  if (!response.ok) throw new Error('Historical weather request failed.')
  const payload = (await response.json()) as ArchiveResponse
  const daily = payload.daily
  if (!daily?.time.length)
    throw new Error('No historical weather was returned.')

  return daily.time.map<ClimateDailyRecord>((date, index) => ({
    date,
    high: daily.temperature_2m_max[index] ?? null,
    low: daily.temperature_2m_min[index] ?? null,
    precipitation: daily.precipitation_sum[index] ?? null,
    snowfall: daily.snowfall_sum?.[index] ?? null,
    weatherCode: daily.weather_code?.[index] ?? null,
    sunrise: daily.sunrise?.[index] ?? null,
    sunset: daily.sunset?.[index] ?? null,
    daylightSeconds: daily.daylight_duration?.[index] ?? null,
  }))
}

export const useClimateProfileQuery = (
  city: City | null,
  band: ComfortBand = defaultComfortBand,
  enabled = true,
) => {
  const query = useQuery({
    queryKey: ['climate-records', city?.latitude, city?.longitude],
    queryFn: ({ signal }) => fetchClimateRecords(city!, signal),
    enabled: enabled && Boolean(city),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  // The comfort band is a user preference, so recompute locally instead of
  // refetching several years of daily weather every time a slider moves.
  const profile: ClimateProfile | null = query.data
    ? buildClimateProfile(query.data, band)
    : null

  return { ...query, profile }
}
