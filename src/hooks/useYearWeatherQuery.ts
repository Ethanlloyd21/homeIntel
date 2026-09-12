import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchWeatherOutlook, localDate } from 'services/weatherOutlook'
export type {
  WeatherOutlook as YearWeatherOutlook,
  WeatherMonth as YearWeatherMonth,
  WeatherDay as YearWeatherDay,
} from 'services/weatherOutlook'
export const useYearWeatherQuery = (city: City, enabled = true) =>
  useQuery({
    queryKey: [
      'weather-outlook-v5',
      city.latitude,
      city.longitude,
      localDate(city.timezone),
    ],
    queryFn: ({ signal }) => fetchWeatherOutlook(city, signal),
    enabled,
    staleTime: 6 * 60 * 60 * 1000,
  })
