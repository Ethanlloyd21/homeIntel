import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'

type ArchiveResponse = {
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code?: number[]
  }
}

type ForecastResponse = {
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code: number[]
  }
}

type SeasonalResponse = {
  monthly?: {
    time: string[]
    temperature_max24h_2m_mean: Array<number | null>
    temperature_min24h_2m_mean: Array<number | null>
    precipitation_mean: Array<number | null>
  }
}

export type YearWeatherMonth = {
  key: string
  label: string
  high: number | null
  low: number | null
  precipitation: number | null
  daysReported: number
  source: 'observed' | 'partial' | 'forecast' | 'pending'
  days: YearWeatherDay[]
}

export type YearWeatherDay = {
  date: string
  day: number
  high: number | null
  low: number | null
  precipitation: number | null
  weatherCode: number | null
  source: 'observed' | 'forecast' | 'unavailable'
}

export type YearWeatherOutlook = {
  months: YearWeatherMonth[]
  year: number
  reportedThrough: string
}

const average = (values: number[]) =>
  values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

const fetchYearWeather = async (city: City, signal: AbortSignal) => {
  const today = new Date()
  const year = today.getFullYear()
  const archiveEnd = new Date(today)
  archiveEnd.setDate(archiveEnd.getDate() - 7)
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'auto',
    start_date: `${year}-01-01`,
    end_date: isoDate(archiveEnd),
  })
  const seasonalParams = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    monthly:
      'temperature_max24h_2m_mean,temperature_min24h_2m_mean,precipitation_mean',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    models: 'ecmwf_seas5',
    forecast_months: '7',
  })
  const forecastParams = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'auto',
    past_days: '7',
    forecast_days: '16',
  })
  const [response, seasonalResponse, forecastResponse] = await Promise.all([
    fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, {
      signal,
    }),
    fetch(
      `https://seasonal-api.open-meteo.com/v1/seasonal?${seasonalParams}`,
      { signal },
    ).catch(() => undefined),
    fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, {
      signal,
    }).catch(() => undefined),
  ])
  if (!response.ok) throw new Error('Current-year weather request failed')
  const result = (await response.json()) as ArchiveResponse
  if (!result.daily?.time.length)
    throw new Error('Current-year weather is unavailable')

  const seasonalResult = seasonalResponse?.ok
    ? ((await seasonalResponse.json()) as SeasonalResponse)
    : undefined
  const forecastResult = forecastResponse?.ok
    ? ((await forecastResponse.json()) as ForecastResponse)
    : undefined
  const dailyValues = new Map<
    string,
    Omit<YearWeatherDay, 'date' | 'day'>
  >()
  result.daily.time.forEach((date, index) => {
    dailyValues.set(date, {
      high: result.daily!.temperature_2m_max[index] ?? null,
      low: result.daily!.temperature_2m_min[index] ?? null,
      precipitation: result.daily!.precipitation_sum[index] ?? null,
      weatherCode: result.daily!.weather_code?.[index] ?? null,
      source: 'observed',
    })
  })
  const todayKey = isoDate(today)
  forecastResult?.daily?.time.forEach((date, index) => {
    if (date < todayKey && dailyValues.has(date)) return
    dailyValues.set(date, {
      high: forecastResult.daily!.temperature_2m_max[index] ?? null,
      low: forecastResult.daily!.temperature_2m_min[index] ?? null,
      precipitation: forecastResult.daily!.precipitation_sum[index] ?? null,
      weatherCode: forecastResult.daily!.weather_code[index] ?? null,
      source: date < todayKey ? 'observed' : 'forecast',
    })
  })
  const forecastValues = new Map<
    number,
    { high: number | null; low: number | null; precipitation: number | null }
  >()
  seasonalResult?.monthly?.time.forEach((date, index) => {
    if (Number(date.slice(0, 4)) !== year) return
    forecastValues.set(Number(date.slice(5, 7)) - 1, {
      high: seasonalResult.monthly!.temperature_max24h_2m_mean[index] ?? null,
      low: seasonalResult.monthly!.temperature_min24h_2m_mean[index] ?? null,
      precipitation:
        seasonalResult.monthly!.precipitation_mean[index] ?? null,
    })
  })

  const monthlyValues = new Map<
    number,
    { highs: number[]; lows: number[]; precipitation: number[] }
  >()
  result.daily.time.forEach((date, index) => {
    const month = Number(date.slice(5, 7)) - 1
    const values = monthlyValues.get(month) ?? {
      highs: [],
      lows: [],
      precipitation: [],
    }
    const high = result.daily!.temperature_2m_max[index]
    const low = result.daily!.temperature_2m_min[index]
    const precipitation = result.daily!.precipitation_sum[index]
    if (Number.isFinite(high)) values.highs.push(high)
    if (Number.isFinite(low)) values.lows.push(low)
    if (Number.isFinite(precipitation)) values.precipitation.push(precipitation)
    monthlyValues.set(month, values)
  })

  const lastReportedDate = result.daily.time.at(-1)!
  const lastReportedMonth = Number(lastReportedDate.slice(5, 7)) - 1
  const months = Array.from({ length: 12 }, (_, month) => {
    const values = monthlyValues.get(month)
    const forecast = forecastValues.get(month)
    const date = new Date(Date.UTC(year, month, 1))
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const source = !values
      ? forecast
        ? 'forecast'
        : 'pending'
      : month === lastReportedMonth
        ? 'partial'
        : 'observed'
    return {
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString([], {
        month: 'long',
        timeZone: 'UTC',
      }),
      high: values ? average(values.highs) : (forecast?.high ?? null),
      low: values ? average(values.lows) : (forecast?.low ?? null),
      precipitation: values
        ? values.precipitation.reduce((total, value) => total + value, 0)
        : (forecast?.precipitation ?? null),
      daysReported:
        values?.highs.length ?? new Date(year, month + 1, 0).getDate(),
      source,
      days: Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const daily = dailyValues.get(dateKey)
        return {
          date: dateKey,
          day,
          high: daily?.high ?? null,
          low: daily?.low ?? null,
          precipitation: daily?.precipitation ?? null,
          weatherCode: daily?.weatherCode ?? null,
          source: daily?.source ?? 'unavailable',
        }
      }),
    } satisfies YearWeatherMonth
  })

  return {
    months,
    year,
    reportedThrough: new Date(
      `${lastReportedDate}T12:00:00`,
    ).toLocaleDateString([], {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  } satisfies YearWeatherOutlook
}

export const useYearWeatherQuery = (city: City, enabled = true) =>
  useQuery({
    queryKey: [
      'current-year-weather-v4',
      city.latitude,
      city.longitude,
      new Date().getFullYear(),
    ],
    queryFn: ({ signal }) => fetchYearWeather(city, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
