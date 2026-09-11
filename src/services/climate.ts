export type ClimateDailyRecord = {
  date: string
  high: number | null
  low: number | null
  precipitation: number | null
  snowfall: number | null
  weatherCode: number | null
  sunrise: string | null
  sunset: string | null
  daylightSeconds: number | null
}

export type ComfortBand = {
  lowF: number
  highF: number
}

export type SeasonKey = 'winter' | 'spring' | 'summer' | 'autumn'

export type SeasonProfile = {
  key: SeasonKey
  label: string
  averageHigh: number | null
  averageLow: number | null
  wetDayShare: number
  daysObserved: number
}

export type ClimateProfile = {
  yearsObserved: number
  daysObserved: number
  firstDate: string
  lastDate: string
  /** Days per year whose daytime high sits inside the comfort band. */
  comfortableDaysPerYear: number
  /** Comfortable days that are also essentially dry. */
  pleasantDaysPerYear: number
  hotDaysPerYear: number
  veryHotDaysPerYear: number
  freezingDaysPerYear: number
  wetDaysPerYear: number
  snowDaysPerYear: number
  averageAnnualHigh: number | null
  averageAnnualLow: number | null
  hottestMonth: { label: string; averageHigh: number | null } | null
  coldestMonth: { label: string; averageLow: number | null } | null
  seasons: SeasonProfile[]
  /** Real observed days used by the Day-in-the-Life scenarios. */
  representative: {
    typicalSummer: ClimateDailyRecord | null
    typicalWinter: ClimateDailyRecord | null
    typicalSpring: ClimateDailyRecord | null
    hottest: ClimateDailyRecord | null
    coldest: ClimateDailyRecord | null
    wettest: ClimateDailyRecord | null
  }
}

export const defaultComfortBand: ComfortBand = { lowF: 60, highF: 82 }

/** Wet-day threshold in inches. Below this a day reads as dry to a resident. */
const WET_DAY_INCHES = 0.04

const seasonLabels: Record<SeasonKey, string> = {
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
}

const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const seasonOfMonth = (month: number): SeasonKey => {
  if (month === 12 || month <= 2) return 'winter'
  if (month <= 5) return 'spring'
  if (month <= 8) return 'summer'
  return 'autumn'
}

const mean = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export const buildClimateProfile = (
  records: ClimateDailyRecord[],
  band: ComfortBand = defaultComfortBand,
): ClimateProfile | null => {
  const usable = records.filter((record) => isNumber(record.high))
  if (usable.length < 60) return null

  const lowF = Math.min(band.lowF, band.highF)
  const highF = Math.max(band.lowF, band.highF)
  const years = usable.length / 365.25
  const perYear = (count: number) => Math.round(count / years)
  const highOf = (record: ClimateDailyRecord) => record.high as number

  const comfortable = usable.filter(
    (record) => highOf(record) >= lowF && highOf(record) <= highF,
  )
  const pleasant = comfortable.filter(
    (record) => (record.precipitation ?? 0) < WET_DAY_INCHES,
  )

  const monthlyHighs = new Map<number, number[]>()
  const monthlyLows = new Map<number, number[]>()
  const seasonBuckets = new Map<
    SeasonKey,
    { highs: number[]; lows: number[]; wet: number; days: number }
  >()

  for (const record of usable) {
    const month = Number(record.date.slice(5, 7))
    if (!monthlyHighs.has(month)) monthlyHighs.set(month, [])
    if (!monthlyLows.has(month)) monthlyLows.set(month, [])
    monthlyHighs.get(month)!.push(highOf(record))
    if (isNumber(record.low)) monthlyLows.get(month)!.push(record.low)

    const season = seasonOfMonth(month)
    if (!seasonBuckets.has(season))
      seasonBuckets.set(season, { highs: [], lows: [], wet: 0, days: 0 })
    const bucket = seasonBuckets.get(season)!
    bucket.highs.push(highOf(record))
    if (isNumber(record.low)) bucket.lows.push(record.low)
    if ((record.precipitation ?? 0) >= WET_DAY_INCHES) bucket.wet += 1
    bucket.days += 1
  }

  const monthAverages = [...monthlyHighs.entries()].map(([month, highs]) => ({
    month,
    averageHigh: mean(highs),
    averageLow: mean(monthlyLows.get(month) ?? []),
  }))
  const hottest = monthAverages.reduce<(typeof monthAverages)[number] | null>(
    (best, entry) =>
      isNumber(entry.averageHigh) &&
      (best === null || entry.averageHigh > (best.averageHigh ?? -Infinity))
        ? entry
        : best,
    null,
  )
  const coldest = monthAverages.reduce<(typeof monthAverages)[number] | null>(
    (best, entry) =>
      isNumber(entry.averageLow) &&
      (best === null || entry.averageLow < (best.averageLow ?? Infinity))
        ? entry
        : best,
    null,
  )

  const seasons: SeasonProfile[] = (
    ['winter', 'spring', 'summer', 'autumn'] as SeasonKey[]
  ).flatMap((key) => {
    const bucket = seasonBuckets.get(key)
    if (!bucket) return []
    return [
      {
        key,
        label: seasonLabels[key],
        averageHigh: mean(bucket.highs),
        averageLow: mean(bucket.lows),
        wetDayShare: bucket.days ? (bucket.wet / bucket.days) * 100 : 0,
        daysObserved: bucket.days,
      },
    ]
  })

  const inMonths = (months: number[]) =>
    usable.filter((record) => months.includes(Number(record.date.slice(5, 7))))
  const medianDay = (pool: ClimateDailyRecord[]) => {
    if (!pool.length) return null
    const sorted = [...pool].sort((a, b) => highOf(a) - highOf(b))
    return sorted[Math.floor(sorted.length / 2)]
  }
  const extremeDay = (
    pool: ClimateDailyRecord[],
    pick: 'max' | 'min',
    field: 'high' | 'low' | 'precipitation',
  ) =>
    pool.reduce<ClimateDailyRecord | null>((best, record) => {
      const value = record[field]
      if (!isNumber(value)) return best
      const bestValue = best ? best[field] : null
      if (!isNumber(bestValue)) return record
      if (pick === 'max') return value > bestValue ? record : best
      return value < bestValue ? record : best
    }, null)

  return {
    yearsObserved: Number(years.toFixed(1)),
    daysObserved: usable.length,
    firstDate: usable[0].date,
    lastDate: usable[usable.length - 1].date,
    comfortableDaysPerYear: perYear(comfortable.length),
    pleasantDaysPerYear: perYear(pleasant.length),
    hotDaysPerYear: perYear(
      usable.filter((record) => highOf(record) >= 90).length,
    ),
    veryHotDaysPerYear: perYear(
      usable.filter((record) => highOf(record) >= 100).length,
    ),
    freezingDaysPerYear: perYear(
      usable.filter((record) => isNumber(record.low) && record.low < 32).length,
    ),
    wetDaysPerYear: perYear(
      usable.filter((record) => (record.precipitation ?? 0) >= WET_DAY_INCHES)
        .length,
    ),
    snowDaysPerYear: perYear(
      usable.filter((record) => (record.snowfall ?? 0) > 0.1).length,
    ),
    averageAnnualHigh: mean(usable.map(highOf)),
    averageAnnualLow: mean(
      usable
        .filter((record) => isNumber(record.low))
        .map((record) => record.low!),
    ),
    hottestMonth: hottest
      ? {
          label: monthLabels[hottest.month - 1],
          averageHigh: hottest.averageHigh,
        }
      : null,
    coldestMonth: coldest
      ? {
          label: monthLabels[coldest.month - 1],
          averageLow: coldest.averageLow,
        }
      : null,
    seasons,
    representative: {
      typicalSummer: medianDay(inMonths([6, 7, 8])),
      typicalWinter: medianDay(inMonths([12, 1, 2])),
      typicalSpring: medianDay(inMonths([4, 5, 9, 10])),
      hottest: extremeDay(usable, 'max', 'high'),
      coldest: extremeDay(usable, 'min', 'low'),
      wettest: extremeDay(usable, 'max', 'precipitation'),
    },
  }
}

/**
 * Comfort delta between two cities, expressed the way a mover feels it:
 * how many more or fewer days a year land inside their preferred range.
 */
export const comfortDelta = (
  destination: ClimateProfile | null,
  origin: ClimateProfile | null,
) =>
  destination && origin
    ? destination.comfortableDaysPerYear - origin.comfortableDaysPerYear
    : null
