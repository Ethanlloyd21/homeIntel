import type { ClimateDailyRecord, ClimateProfile } from 'services/climate'
import type { LifeInputs } from 'services/lifeSimulator'

export type DayScenarioKey =
  'workday' | 'remote' | 'weekend' | 'winter' | 'extreme'

export type MomentTone = 'neutral' | 'good' | 'caution' | 'alert'

export type DayMoment = {
  time: string
  title: string
  detail: string
  tone: MomentTone
  /** Short provenance string so every line in the day is traceable. */
  source: string
}

export type DayScenario = {
  key: DayScenarioKey
  label: string
  description: string
  /** The real observed day this scenario is built from, when there is one. */
  basisDate: string | null
  conditions: {
    high: number | null
    low: number | null
    precipitation: number | null
    sunrise: string | null
    sunset: string | null
    daylightHours: number | null
  }
  moments: DayMoment[]
  /** Two or three lines summarising what the day costs or demands. */
  footnotes: string[]
}

export type DayContext = {
  cityName: string
  climate: ClimateProfile | null
  inputs: LifeInputs
  commuteMinutes: number | null
  commuteMilesMeasured: number | null
  trafficDelayPercent: number | null
  transitStopCount: number
  nearestHospital: { name: string; miles: number } | null
  nearestSchool: { name: string; miles: number } | null
  nearestCollege: { name: string; miles: number } | null
  fuelCostPerCommuteDay: number | null
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Open-Meteo returns local ISO strings such as 2024-07-15T05:42. */
const clockFromIso = (value: string | null) => {
  if (!value) return null
  const time = value.includes('T') ? value.split('T')[1] : value
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return { hour, minute }
}

const formatClock = (hour: number, minute: number) => {
  const normalisedHour = ((hour % 24) + 24) % 24
  const suffix = normalisedHour >= 12 ? 'PM' : 'AM'
  const display = normalisedHour % 12 === 0 ? 12 : normalisedHour % 12
  return `${display}:${pad(Math.round(minute))} ${suffix}`
}

const shiftClock = (
  base: { hour: number; minute: number },
  minutes: number,
) => {
  const total = base.hour * 60 + base.minute + minutes
  return formatClock(Math.floor(total / 60), ((total % 60) + 60) % 60)
}

const formatDate = (date: string | null) => {
  if (!date) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

const temperature = (value: number | null) =>
  typeof value === 'number'
    ? `${Math.round(value)}°F`
    : 'an unknown temperature'

const weatherWord = (record: ClimateDailyRecord | null) => {
  const rain = record?.precipitation ?? 0
  if (rain >= 0.5) return 'heavy rain'
  if (rain >= 0.1) return 'rain'
  if ((record?.snowfall ?? 0) > 0.1) return 'snow'
  return 'dry skies'
}

const distanceLine = (
  place: { name: string; miles: number } | null,
  fallback: string,
) =>
  place ? `${place.name} is ${place.miles.toFixed(1)} miles away.` : fallback

/** Rough door-to-door minutes when no routed commute has been measured. */
const estimatedCommuteMinutes = (miles: number) =>
  miles > 0 ? Math.max(6, Math.round((miles / 26) * 60)) : null

const buildScenario = (
  key: DayScenarioKey,
  label: string,
  description: string,
  record: ClimateDailyRecord | null,
  context: DayContext,
): DayScenario => {
  const { inputs, cityName } = context
  const sunrise = clockFromIso(record?.sunrise ?? null)
  const sunset = clockFromIso(record?.sunset ?? null)
  const daylightHours = record?.daylightSeconds
    ? record.daylightSeconds / 3_600
    : null
  const commuteMinutes =
    context.commuteMinutes ?? estimatedCommuteMinutes(inputs.commuteMiles)
  const commuteIsMeasured = context.commuteMinutes !== null
  const commuteSource = commuteIsMeasured
    ? 'TomTom live traffic route'
    : 'Estimated from your commute distance at 26 mph door-to-door'
  const weatherSource = record
    ? `Observed ${formatDate(record.date)} · Open-Meteo archive`
    : 'Open-Meteo archive'
  const conditions = {
    high: record?.high ?? null,
    low: record?.low ?? null,
    precipitation: record?.precipitation ?? null,
    sunrise: sunrise ? formatClock(sunrise.hour, sunrise.minute) : null,
    sunset: sunset ? formatClock(sunset.hour, sunset.minute) : null,
    daylightHours,
  }

  const wake = sunrise
    ? shiftClock(sunrise, key === 'weekend' ? 120 : -25)
    : key === 'weekend'
      ? '8:15 AM'
      : '6:35 AM'

  const moments: DayMoment[] = []

  if (key === 'workday' || key === 'winter' || key === 'extreme') {
    const departure = sunrise ? shiftClock(sunrise, 60) : '7:35 AM'
    moments.push({
      time: wake,
      title: 'You wake up',
      detail: conditions.sunrise
        ? `Sunrise is ${conditions.sunrise}. Overnight low around ${temperature(conditions.low)}.`
        : `Overnight low around ${temperature(conditions.low)}.`,
      tone:
        (conditions.low ?? 40) < 20
          ? 'caution'
          : (conditions.low ?? 60) > 80
            ? 'caution'
            : 'neutral',
      source: weatherSource,
    })

    if (commuteMinutes === null) {
      moments.push({
        time: departure,
        title: 'You leave for work — length unknown',
        detail:
          'No commute has been measured yet. Pin a home point and a workplace on the Neighbourhoods page, or enter a commute distance in the Life Simulator.',
        tone: 'caution',
        source: 'Awaiting your home and workplace points',
      })
    } else {
      const fuel = context.fuelCostPerCommuteDay
      moments.push(
        {
          time: departure,
          title: 'You leave for work',
          detail: `${Math.round(commuteMinutes)} minutes each way${
            context.trafficDelayPercent !== null
              ? `, including a ${Math.round(context.trafficDelayPercent)}% traffic delay over free-flow`
              : ''
          }.${
            fuel && fuel > 0
              ? ` Fuel for the round trip runs about $${fuel.toFixed(2)}.`
              : ''
          }`,
          tone:
            commuteMinutes >= 45
              ? 'alert'
              : commuteMinutes >= 30
                ? 'caution'
                : 'good',
          source: commuteSource,
        },
        {
          time: sunrise
            ? shiftClock(sunrise, 60 + commuteMinutes)
            : `${commuteMinutes} minutes later`,
          title: 'You arrive',
          detail:
            context.transitStopCount > 0
              ? `${context.transitStopCount} transit stops sit within a few miles of the centre if you would rather not drive.`
              : 'No mapped transit stops nearby — this commute is a driving commute.',
          tone: context.transitStopCount > 0 ? 'good' : 'caution',
          source: 'OpenStreetMap transit stops',
        },
      )
    }
  }

  if (key === 'remote') {
    moments.push(
      {
        time: wake,
        title: 'You wake up at home',
        detail: conditions.sunrise
          ? `Sunrise is ${conditions.sunrise}, with ${daylightHours ? `${daylightHours.toFixed(1)} hours` : 'a full day'} of daylight ahead.`
          : 'No commute today.',
        tone: 'good',
        source: weatherSource,
      },
      {
        time: '9:00 AM',
        title: 'You start work without leaving',
        detail:
          commuteMinutes === null
            ? 'Set a commute on the Neighbourhoods page to see how many hours a month working from home gives you back.'
            : `The ${Math.round(commuteMinutes)}-minute commute you skip is worth about ${Math.round(
                (commuteMinutes * 2 * inputs.commuteDaysPerWeek * 4.33) / 60,
              )} hours a month at your office schedule.`,
        tone: 'good',
        source: commuteSource,
      },
      {
        time: '12:30 PM',
        title: 'Lunch outdoors, or not',
        detail: `Midday sits near ${temperature(conditions.high)} with ${weatherWord(record)}. ${cityName} gives you ${context.climate?.pleasantDaysPerYear ?? 0} genuinely pleasant days a year.`,
        tone:
          (context.climate?.pleasantDaysPerYear ?? 0) >= 120
            ? 'good'
            : 'neutral',
        source: weatherSource,
      },
    )
  }

  if (key === 'weekend') {
    moments.push(
      {
        time: wake,
        title: 'A slow start',
        detail: `Daytime high near ${temperature(conditions.high)} with ${weatherWord(record)}.`,
        tone: 'good',
        source: weatherSource,
      },
      {
        time: '10:00 AM',
        title: 'Errands and groceries',
        detail: `A household of ${inputs.householdSize} runs a typical weekly shop here; local price levels are built into your simulator budget.`,
        tone: 'neutral',
        source: 'BEA regional price parity',
      },
      {
        time: '1:00 PM',
        title: 'School and campus run',
        detail:
          `${distanceLine(context.nearestSchool, 'No public school was matched near the centre.')} ${distanceLine(context.nearestCollege, '')}`.trim(),
        tone: context.nearestSchool ? 'good' : 'caution',
        source: 'NCES Common Core of Data · College Scorecard',
      },
    )
  }

  if (key === 'winter') {
    moments.push({
      time: '5:30 PM',
      title: 'The light goes early',
      detail: conditions.sunset
        ? `Sunset is ${conditions.sunset}${daylightHours ? `, giving you ${daylightHours.toFixed(1)} hours of daylight` : ''}. ${context.climate?.freezingDaysPerYear ?? 0} nights a year fall below freezing here.`
        : `${context.climate?.freezingDaysPerYear ?? 0} nights a year fall below freezing here.`,
      tone:
        (context.climate?.freezingDaysPerYear ?? 0) > 90
          ? 'caution'
          : 'neutral',
      source: weatherSource,
    })
  }

  if (key === 'extreme') {
    moments.push({
      time: '3:00 PM',
      title: 'Peak heat',
      detail: `${temperature(conditions.high)} on the hottest day in the record. ${context.climate?.veryHotDaysPerYear ?? 0} days a year reach 100°F and ${context.climate?.hotDaysPerYear ?? 0} reach 90°F.`,
      tone: (conditions.high ?? 0) >= 100 ? 'alert' : 'caution',
      source: weatherSource,
    })
  }

  moments.push({
    time: key === 'weekend' ? '4:00 PM' : '6:30 PM',
    title: 'If something goes wrong',
    detail: distanceLine(
      context.nearestHospital,
      'No major hospital was matched near the city centre.',
    ),
    tone: (context.nearestHospital?.miles ?? 99) <= 10 ? 'good' : 'caution',
    source: 'HIFLD hospital facilities',
  })

  moments.push({
    time: conditions.sunset ?? '8:00 PM',
    title: 'Evening',
    detail: conditions.sunset
      ? `Sunset at ${conditions.sunset}. Evening settles toward ${temperature(conditions.low)}.`
      : `Evening settles toward ${temperature(conditions.low)}.`,
    tone: 'neutral',
    source: weatherSource,
  })

  const footnotes = [
    record
      ? `Built from a real observed day in ${cityName}: ${formatDate(record.date)}.`
      : `No observed daily weather was available for this scenario in ${cityName}.`,
    commuteIsMeasured
      ? 'Commute time is a live routed trip, not a city average.'
      : 'Commute time is estimated from the distance you entered. Set a home and workplace point on Neighborhoods for a routed time.',
  ]

  return {
    key,
    label,
    description,
    basisDate: record?.date ?? null,
    conditions,
    moments,
    footnotes,
  }
}

export const buildDayScenarios = (context: DayContext): DayScenario[] => {
  const representative = context.climate?.representative
  return [
    buildScenario(
      'workday',
      'Office workday',
      'A typical mild day with your office schedule.',
      representative?.typicalSpring ?? representative?.typicalSummer ?? null,
      context,
    ),
    buildScenario(
      'remote',
      'Remote-work day',
      'The same day without the commute.',
      representative?.typicalSpring ?? representative?.typicalSummer ?? null,
      context,
    ),
    buildScenario(
      'weekend',
      'Family weekend',
      'Errands, schools, and the pace of a Saturday.',
      representative?.typicalSummer ?? null,
      context,
    ),
    buildScenario(
      'winter',
      'Winter day',
      'A median winter day, with real sunset times.',
      representative?.typicalWinter ?? null,
      context,
    ),
    buildScenario(
      'extreme',
      'Extreme-weather day',
      'The hottest day in the observed record.',
      representative?.hottest ?? null,
      context,
    ),
  ]
}
