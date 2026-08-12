import { useQuery } from '@tanstack/react-query'
import type { City } from '../data/cities'

export type ForecastResponse = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    precipitation: number
    weather_code: number
    time: string
  }
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

async function fetchWeather(city: City, signal: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '1',
  })
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal },
  )
  if (!response.ok) throw new Error('Weather request failed')
  return (await response.json()) as ForecastResponse
}

export function useWeatherQuery(city: City, enabled = true) {
  return useQuery({
    queryKey: ['weather', city.latitude, city.longitude],
    queryFn: ({ signal }) => fetchWeather(city, signal),
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}
