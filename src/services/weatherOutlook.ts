export type DailyWeather = {
  time: string[]
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
  precipitation_sum: (number | null)[]
  weather_code?: (number | null)[]
  relative_humidity_2m_mean?: (number | null)[]
  snowfall_sum?: (number | null)[]
  wind_gusts_10m_max?: (number | null)[]
}
export type WeatherDay = {
  date: string
  day: number
  high: number | null
  low: number | null
  precipitation: number | null
  humidity: number | null
  wetChance: number | null
  weatherCode: number | null
  source: 'observed' | 'forecast' | 'typical' | 'unavailable'
  samples: number
}
export type ClimateMonth = {
  month: number
  label: string
  high: number | null
  low: number | null
  humidity: number | null
  precipitation: number | null
  wetDays: number | null
  freezeDays: number | null
  hotDays: number | null
  snowDays: number | null
  windyDays: number | null
  samples: number
}
export type WeatherMonth = {
  key: string
  label: string
  days: WeatherDay[]
  high: number | null
  low: number | null
  precipitation: number | null
  source: 'observed' | 'forecast' | 'partial' | 'typical' | 'pending'
  daysReported: number
}
export type WeatherOutlook = {
  months: WeatherMonth[]
  climate: ClimateMonth[]
  year: number
  today: string
  reportedThrough: string
  baseline: string
  historicalYears: number
  forecastThrough: string | null
  warmestDay: { date: string; value: number } | null
  coldestDay: { date: string; value: number } | null
}
const valid = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v)
const mean = (values: (number | null | undefined)[]) => {
  const ns = values.filter(valid)
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null
}
export const localDate = (timeZone: string, now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  return ['year', 'month', 'day']
    .map((key) => parts.find((p) => p.type === key)!.value)
    .join('-')
}
export const buildWeatherOutlook = (
  archive: DailyWeather,
  forecast: DailyWeather | undefined,
  today: string,
): WeatherOutlook => {
  const year = Number(today.slice(0, 4))
  const baseline = archive.time.flatMap((date, i) =>
    Number(date.slice(0, 4)) < year ? [i] : [],
  )
  const years = new Set(baseline.map((i) => archive.time[i].slice(0, 4)))
  const actual = new Map<string, WeatherDay>()
  const add = (daily: DailyWeather, source: 'observed' | 'forecast') =>
    daily.time.forEach((date, i) => {
      if (
        Number(date.slice(0, 4)) !== year ||
        (source === 'observed' && date >= today)
      )
        return
      if (source === 'forecast' && date < today && actual.has(date)) return
      actual.set(date, {
        date,
        day: Number(date.slice(-2)),
        high: daily.temperature_2m_max[i] ?? null,
        low: daily.temperature_2m_min[i] ?? null,
        precipitation: daily.precipitation_sum[i] ?? null,
        weatherCode: daily.weather_code?.[i] ?? null,
        humidity: daily.relative_humidity_2m_mean?.[i] ?? null,
        wetChance: null,
        source,
        samples: 1,
      })
    })
  add(archive, 'observed')
  if (forecast) add(forecast, 'forecast')
  const label = (month: number) =>
    new Date(Date.UTC(2000, month, 1)).toLocaleDateString('en-US', {
      month: 'long',
      timeZone: 'UTC',
    })
  const climate = Array.from({ length: 12 }, (_, month): ClimateMonth => {
    const indices = baseline.filter(
      (i) => Number(archive.time[i].slice(5, 7)) === month + 1,
    )
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const count = (
      values: (number | null)[] | undefined,
      predicate: (n: number) => boolean,
    ) => {
      const ns = indices.map((i) => values?.[i]).filter(valid)
      return ns.length ? (ns.filter(predicate).length / ns.length) * days : null
    }
    const rain = mean(indices.map((i) => archive.precipitation_sum[i]))
    return {
      month,
      label: label(month),
      samples: indices.length,
      high: mean(indices.map((i) => archive.temperature_2m_max[i])),
      low: mean(indices.map((i) => archive.temperature_2m_min[i])),
      humidity: mean(
        indices.map((i) => archive.relative_humidity_2m_mean?.[i]),
      ),
      precipitation: rain === null ? null : rain * days,
      wetDays: count(archive.precipitation_sum, (n) => n >= 0.01),
      freezeDays: count(archive.temperature_2m_min, (n) => n <= 32),
      hotDays: count(archive.temperature_2m_max, (n) => n >= 90),
      snowDays: count(archive.snowfall_sum, (n) => n > 0),
      windyDays: count(archive.wind_gusts_10m_max, (n) => n >= 35),
    }
  })
  const ordinal = (date: string) =>
    Math.round(
      (Date.parse(`2000-${date.slice(5)}T12:00:00Z`) -
        Date.UTC(2000, 0, 1, 12)) /
        86400000,
    )
  const ordinals = baseline.map((i) => ({
    i,
    ordinal: ordinal(archive.time[i]),
  }))
  const months = climate.map((normal, month): WeatherMonth => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const days = Array.from(
      { length: new Date(Date.UTC(year, month + 1, 0)).getUTCDate() },
      (_, index): WeatherDay => {
        const date = `${key}-${String(index + 1).padStart(2, '0')}`
        const record = actual.get(date)
        if (record && valid(record.high) && valid(record.low)) return record
        const target = ordinal(date)
        const nearby = ordinals
          .filter((item) => {
            const distance = Math.abs(item.ordinal - target)
            return Math.min(distance, 366 - distance) <= 7
          })
          .map((item) => item.i)
        const rain = nearby
          .map((i) => archive.precipitation_sum[i])
          .filter(valid)
        return {
          date,
          day: index + 1,
          high: mean(nearby.map((i) => archive.temperature_2m_max[i])),
          low: mean(nearby.map((i) => archive.temperature_2m_min[i])),
          precipitation: mean(rain),
          humidity: mean(
            nearby.map((i) => archive.relative_humidity_2m_mean?.[i]),
          ),
          weatherCode: null,
          wetChance: rain.length
            ? (rain.filter((p) => p >= 0.01).length / rain.length) * 100
            : null,
          samples: nearby.length,
          source:
            nearby.length >= 30 && years.size >= 3 ? 'typical' : 'unavailable',
        }
      },
    )
    const sources = new Set(days.map((d) => d.source))
    const source =
      sources.size > 1
        ? 'partial'
        : days[0].source === 'unavailable'
          ? 'pending'
          : days[0].source
    const precip = days.map((d) => d.precipitation)
    return {
      key,
      label: normal.label,
      days,
      high: mean(days.map((d) => d.high)),
      low: mean(days.map((d) => d.low)),
      precipitation: precip.every(valid)
        ? precip.reduce((a, b) => a + b, 0)
        : null,
      source,
      daysReported: days.filter((d) => d.source === 'observed').length,
    }
  })
  const extreme = (
    field: 'temperature_2m_max' | 'temperature_2m_min',
    descending: boolean,
  ) => {
    const indices = baseline
      .filter((i) => valid(archive[field][i]))
      .sort(
        (a, b) =>
          (archive[field][a]! - archive[field][b]!) * (descending ? -1 : 1),
      )
    return indices.length
      ? { date: archive.time[indices[0]], value: archive[field][indices[0]]! }
      : null
  }
  return {
    months,
    climate,
    year,
    today,
    reportedThrough: archive.time.filter((d) => d < today).at(-1) ?? '',
    baseline: years.size
      ? `${Math.min(...[...years].map(Number))}–${Math.max(...[...years].map(Number))}`
      : 'Unavailable',
    historicalYears: years.size,
    forecastThrough: forecast?.time.at(-1) ?? null,
    warmestDay: extreme('temperature_2m_max', true),
    coldestDay: extreme('temperature_2m_min', false),
  }
}
export const fetchWeatherOutlook = async (
  city: { latitude: number; longitude: number; timezone: string },
  signal: AbortSignal,
) => {
  const today = localDate(city.timezone),
    year = Number(today.slice(0, 4))
  const end = new Date(`${today}T12:00:00Z`)
  end.setUTCDate(end.getUTCDate() - 7)
  const shared = {
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    wind_speed_unit: 'mph',
    timezone: city.timezone,
  }
  const params = new URLSearchParams({
    ...shared,
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,relative_humidity_2m_mean,snowfall_sum,wind_gusts_10m_max',
    start_date: `${year - 10}-01-01`,
    end_date: end.toISOString().slice(0, 10),
  })
  const forecastParams = new URLSearchParams({
    ...shared,
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    past_days: '7',
    forecast_days: '16',
  })
  const [archive, forecast] = await Promise.all([
    fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, {
      signal,
    }).then(async (r) => {
      if (!r.ok) throw new Error('Historical weather unavailable')
      return (await r.json()) as { daily: DailyWeather }
    }),
    fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, {
      signal,
    })
      .then(async (r) =>
        r.ok ? ((await r.json()) as { daily: DailyWeather }) : undefined,
      )
      .catch(() => undefined),
  ])
  if (signal.aborted) throw signal.reason
  if (!archive.daily?.time.length)
    throw new Error('No historical weather records')
  return buildWeatherOutlook(archive.daily, forecast?.daily, today)
}
