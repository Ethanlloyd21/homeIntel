import { useQueries, useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import {
  buildWeatherOutlook,
  fetchWeatherDaily,
  localDate,
  mergeWeatherHistory,
  weatherOutlookRequests,
  type DailyWeather,
} from 'services/weatherOutlook'
export type {
  WeatherOutlook as YearWeatherOutlook,
  WeatherMonth as YearWeatherMonth,
  WeatherDay as YearWeatherDay,
} from 'services/weatherOutlook'
export const useYearWeatherQuery = (city: City, enabled = true) => {
  const today = localDate(city.timezone)
  const requests = weatherOutlookRequests(city, today)
  const forecast = useQuery({
    queryKey: ['weather-forecast-v6', requests.forecastUrl, today],
    queryFn: ({ signal }) => fetchWeatherDaily(requests.forecastUrl, signal),
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
  const history = useQueries({
    queries: requests.history.map((request) => ({
      queryKey: ['weather-archive-year-v6', request.url],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchWeatherDaily(request.url, signal, true),
      enabled,
      staleTime: (request.complete ? 30 * 24 : 6) * 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: false,
    })),
  })
  const parts = history
    .map((query) => query.data)
    .filter((part): part is DailyWeather => Boolean(part))
  const data =
    parts.length || forecast.data
      ? buildWeatherOutlook(mergeWeatherHistory(parts), forecast.data, today)
      : undefined
  const queries = [forecast, ...history]
  const failures = queries.filter((query) => query.isError)
  const isFetching = queries.some((query) => query.isFetching)
  return {
    data,
    isPending: !data && isFetching,
    isFetching,
    isError: failures.length > 0,
    error: failures[0]?.error ?? null,
    historyLoaded: history.filter((query) => query.data).length,
    historyTotal: history.length,
    // Keep successful chunks, including cached data from a failed refresh.
    refetch: () =>
      Promise.allSettled(
        queries
          .filter(
            (query) => !query.isFetching && (query.isError || !query.data),
          )
          .map((query) => query.refetch()),
      ),
  }
}
