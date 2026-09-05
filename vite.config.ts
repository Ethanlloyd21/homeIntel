import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import {
  MINIMUM_WAGE_EFFECTIVE_DATE,
  MINIMUM_WAGE_SOURCE,
  stateMinimumWages,
} from './src/data/stateMinimumWages.ts'

const statePattern = /^[A-Z]{2}$/
const stateCodes: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
}

const stateFipsByCode: Record<string, string> = {
  AL: '01',
  AK: '02',
  AZ: '04',
  AR: '05',
  CA: '06',
  CO: '08',
  CT: '09',
  DE: '10',
  DC: '11',
  FL: '12',
  GA: '13',
  HI: '15',
  ID: '16',
  IL: '17',
  IN: '18',
  IA: '19',
  KS: '20',
  KY: '21',
  LA: '22',
  ME: '23',
  MD: '24',
  MA: '25',
  MI: '26',
  MN: '27',
  MS: '28',
  MO: '29',
  MT: '30',
  NE: '31',
  NV: '32',
  NH: '33',
  NJ: '34',
  NM: '35',
  NY: '36',
  NC: '37',
  ND: '38',
  OH: '39',
  OK: '40',
  OR: '41',
  PA: '42',
  RI: '44',
  SC: '45',
  SD: '46',
  TN: '47',
  TX: '48',
  UT: '49',
  VT: '50',
  VA: '51',
  WA: '53',
  WV: '54',
  WI: '55',
  WY: '56',
}

const fbiCrimeProxy = (apiKey: string): Plugin => {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/fbi-crime') return next()

    const state = requestUrl.searchParams.get('state')?.toUpperCase() ?? ''
    response.setHeader('Content-Type', 'application/json')
    if (!statePattern.test(state)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid state is required.' }))
      return
    }
    if (!apiKey) {
      response.statusCode = 503
      response.end(
        JSON.stringify({ error: 'Data.gov API key is not configured.' }),
      )
      return
    }

    const upstream = new URL(
      `https://cde.ucr.cjis.gov/LATEST/summarized/state/${state}/violent-crime`,
    )
    upstream.searchParams.set('from', '01-2023')
    upstream.searchParams.set('to', '12-2023')
    upstream.searchParams.set('type', 'totals')
    upstream.searchParams.set('API_KEY', apiKey)

    try {
      const result = await fetch(upstream)
      const body = await result.text()
      response.statusCode = result.status
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(JSON.stringify({ error: 'FBI crime data is unavailable.' }))
    }
  }

  return {
    name: 'homeintel-fbi-crime-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

const collegeScorecardProxy = (apiKey: string): Plugin => {
  const cache = new Map<string, ProxyCacheEntry>()
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/nearby-colleges') return next()

    const city = requestUrl.searchParams.get('city')?.trim() ?? ''
    const stateName = requestUrl.searchParams.get('state')?.trim() ?? ''
    const state = statePattern.test(stateName.toUpperCase())
      ? stateName.toUpperCase()
      : stateCodes[stateName]
    response.setHeader('Content-Type', 'application/json')
    if (!city || city.length > 100 || !state) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid city is required.' }))
      return
    }
    if (!apiKey) {
      response.statusCode = 503
      response.end(
        JSON.stringify({ error: 'Data.gov API key is not configured.' }),
      )
      return
    }
    const cached = cache.get(state)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(cached.body)
      return
    }

    const upstream = new URL(
      'https://api.data.gov/ed/collegescorecard/v1/schools.json',
    )
    upstream.searchParams.set('api_key', apiKey)
    upstream.searchParams.set('school.state', state)
    upstream.searchParams.set('school.operating', '1')
    upstream.searchParams.set(
      'school.degrees_awarded.predominant__range',
      '2..4',
    )
    upstream.searchParams.set(
      'fields',
      [
        'id',
        'school.name',
        'school.city',
        'school.state',
        'location.lat',
        'location.lon',
        'school.school_url',
        'school.ownership',
        'school.degrees_awarded.highest',
        'latest.student.size',
        'latest.academics.program_percentage.computer',
        'latest.academics.program_percentage.engineering',
        'latest.academics.program_percentage.biological',
        'latest.academics.program_percentage.health',
        'latest.academics.program_percentage.business_marketing',
        'latest.academics.program_percentage.education',
        'latest.academics.program_percentage.visual_performing',
        'latest.academics.program_percentage.social_science',
      ].join(','),
    )
    upstream.searchParams.set('_per_page', '100')
    upstream.searchParams.set('_sort', 'latest.student.size:desc')

    try {
      const result = await fetch(upstream, {
        signal: AbortSignal.timeout(15_000),
      })
      const body = await result.text()
      response.statusCode = result.status
      if (result.ok)
        cache.set(state, {
          body,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'College Scorecard data is unavailable.' }),
      )
    }
  }

  return {
    name: 'homeintel-college-scorecard-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

type CcdSchool = {
  city_location?: string
  latitude?: number
  longitude?: number
  virtual?: number | null
  [key: string]: unknown
}

const schoolStateCache = new Map<string, Promise<CcdSchool[]>>()

const schoolDistance = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDelta = radians(latitudeB - latitudeA)
  const longitudeDelta = radians(longitudeB - longitudeA)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const loadStateSchools = (fips: string) => {
  const cached = schoolStateCache.get(fips)
  if (cached) return cached
  const request = (async () => {
    const schools: CcdSchool[] = []
    let next: string | null =
      `https://educationdata.urban.org/api/v1/schools/ccd/directory/2024/?fips=${fips}&school_status=1&school_type=1`
    let page = 0
    while (next && page < 3) {
      const result = await fetch(next, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 HomeIntel/0.1',
        },
        signal: AbortSignal.timeout(30_000),
      })
      if (!result.ok)
        throw new Error(`Education Data API returned ${result.status}.`)
      const payload = (await result.json()) as {
        results?: CcdSchool[]
        next?: string | null
      }
      schools.push(...(payload.results ?? []))
      next = payload.next ?? null
      page += 1
    }
    return schools
  })()
  schoolStateCache.set(fips, request)
  request.catch(() => schoolStateCache.delete(fips))
  return request
}

const nearbySchoolsProxy = (): Plugin => {
  const cache = new Map<string, ProxyCacheEntry>()
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/nearby-schools') return next()
    const city = requestUrl.searchParams.get('city')?.trim() ?? ''
    const stateName = requestUrl.searchParams.get('state')?.trim() ?? ''
    const state = statePattern.test(stateName.toUpperCase())
      ? stateName.toUpperCase()
      : stateCodes[stateName]
    const fips = stateFipsByCode[state]
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    response.setHeader('Content-Type', 'application/json')
    if (
      !city ||
      !fips ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid U.S. city is required.' }))
      return
    }
    const cacheKey = `${fips}|${city}|${latitude}|${longitude}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(cached.body)
      return
    }
    try {
      const stateSchools = await loadStateSchools(fips)
      const normalizedCity = city.toUpperCase().replace(/[^A-Z0-9]/g, '')
      const exact = stateSchools.filter(
        (school) =>
          school.city_location?.toUpperCase().replace(/[^A-Z0-9]/g, '') ===
          normalizedCity,
      )
      const results =
        exact.length > 0
          ? exact
          : stateSchools.filter((school) => {
              if (
                !Number.isFinite(school.latitude) ||
                !Number.isFinite(school.longitude)
              )
                return false
              return (
                schoolDistance(
                  latitude,
                  longitude,
                  school.latitude!,
                  school.longitude!,
                ) <= 15
              )
            })
      const statewideVirtual = stateSchools.filter(
        (school) => school.virtual === 1,
      )
      const body = JSON.stringify({ results, statewideVirtual })
      cache.set(cacheKey, {
        body,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })
      response.statusCode = 200
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'Public school data is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-nearby-schools-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

const upstreamTimeoutMs = 12_000
const timedFetch = (input: string | URL, init: RequestInit = {}) =>
  fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(upstreamTimeoutMs),
  })

type ProxyCacheEntry = { body: string; expiresAt: number }

let lausAreaPromise: Promise<string> | null = null
let lausFlatDataPromise: Promise<string> | null = null

const getLausAreaData = () => {
  lausAreaPromise ??= timedFetch(
    'https://download.bls.gov/pub/time.series/la/la.area',
  )
    .then((response) => {
      if (!response.ok) throw new Error('BLS LAUS areas are unavailable.')
      return response.text()
    })
    .catch((error) => {
      lausAreaPromise = null
      throw error
    })
  return lausAreaPromise
}

const getLausFlatData = () => {
  lausFlatDataPromise ??= Promise.all(
    ['CurrentU15-19', 'CurrentU20-24', 'CurrentU25-29'].map(async (period) => {
      const response = await timedFetch(
        `https://download.bls.gov/pub/time.series/la/la.data.0.${period}`,
      )
      if (!response.ok) throw new Error(`BLS LAUS ${period} is unavailable.`)
      return response.text()
    }),
  )
    .then((files) => files.join('\n'))
    .catch((error) => {
      lausFlatDataPromise = null
      throw error
    })
  return lausFlatDataPromise
}

const currentEconomyProxy = (censusKey: string, beaKey: string): Plugin => {
  const cache = new Map<string, ProxyCacheEntry>()
  const numberValue = (value: unknown) => {
    const parsed = Number(String(value ?? '').replaceAll(',', ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/current-economy') return next()
    response.setHeader('Content-Type', 'application/json')
    const city = requestUrl.searchParams.get('city')?.trim() ?? ''
    const stateName = requestUrl.searchParams.get('state')?.trim() ?? ''
    const state = statePattern.test(stateName.toUpperCase())
      ? stateName.toUpperCase()
      : stateCodes[stateName]
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (
      !city ||
      !state ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid U.S. city is required.' }))
      return
    }

    const cacheKey = `${city}|${state}|${latitude}|${longitude}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=21600')
      response.end(cached.body)
      return
    }

    try {
      const geographyResponse = await timedFetch(
        `https://geo.fcc.gov/api/census/block/find?latitude=${latitude}&longitude=${longitude}&format=json`,
      )
      const geography = (await geographyResponse.json()) as {
        County?: { FIPS?: string; name?: string }
        State?: { FIPS?: string; name?: string }
      }
      const countyFips = geography.County?.FIPS ?? ''
      const stateFips = geography.State?.FIPS ?? countyFips.slice(0, 2)
      const countyCode = countyFips.slice(2)
      const stateMinimumWage = stateMinimumWages[state]

      const lausPromise = (async () => {
        const areaText = await getLausAreaData()
        const row = areaText
          .split(/\r?\n/)
          .map((line) => line.split('\t'))
          .find(
            ([type, , label]) =>
              type === 'G' &&
              label?.toLowerCase().startsWith(`${city.toLowerCase()} `) &&
              label.endsWith(`, ${state}`),
          )
        if (!row?.[1]) return null
        const seriesIds = ['05', '04', '03', '06'].map(
          (measure) => `LAU${row[1]}${measure}`,
        )
        type BlsSeries = {
          seriesID: string
          data: {
            year: string
            period: string
            periodName: string
            value: string
            latest?: string
          }[]
        }
        let bls = (await (
          await timedFetch(
            'https://api.bls.gov/publicAPI/v2/timeseries/data/',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                seriesid: seriesIds,
                startyear: '2019',
                endyear: String(new Date().getFullYear()),
              }),
            },
          )
        ).json()) as {
          Results?: {
            series?: BlsSeries[]
          }
        }
        if (!bls.Results?.series?.some((series) => series.data.length > 0)) {
          const currentData = await getLausFlatData()
          const seriesMap = new Map(
            seriesIds.map((seriesID) => [seriesID, [] as BlsSeries['data']]),
          )
          for (const line of currentData.split(/\r?\n/)) {
            const [rawSeriesId, year, period, rawValue] = line.split('\t')
            const seriesID = rawSeriesId?.trim()
            const target = seriesMap.get(seriesID)
            if (!target || Number(year) < 2019 || !/^M\d{2}$/.test(period))
              continue
            target.push({
              year,
              period,
              periodName:
                period === 'M13'
                  ? 'Annual average'
                  : new Date(2000, Number(period.slice(1)) - 1).toLocaleString(
                      'en-US',
                      { month: 'long' },
                    ),
              value: rawValue.trim(),
            })
          }
          bls = {
            Results: {
              series: [...seriesMap].map(([seriesID, data]) => ({
                seriesID,
                data: data.sort(
                  (a, b) =>
                    Number(b.year) - Number(a.year) ||
                    Number(b.period.slice(1)) - Number(a.period.slice(1)),
                ),
              })),
            },
          }
        }
        const latest = (id: string) =>
          bls.Results?.series
            ?.find((series) => series.seriesID === id)
            ?.data?.find((item) => /^M(0[1-9]|1[0-2])$/.test(item.period))
        const employment = latest(seriesIds[0])
        const unemployment = latest(seriesIds[1])
        const rate = latest(seriesIds[2])
        const laborForce = latest(seriesIds[3])
        const employmentSeries =
          bls.Results?.series?.find(
            (series) => series.seriesID === seriesIds[0],
          )?.data ?? []
        const annualEmployment = Array.from(
          new Set(employmentSeries.map((item) => Number(item.year))),
        )
          .sort((a, b) => a - b)
          .map((year) => {
            const months = employmentSeries.filter(
              (item) =>
                Number(item.year) === year &&
                /^M(0[1-9]|1[0-2])$/.test(item.period),
            )
            const values = months
              .map((item) => numberValue(item.value))
              .filter((value): value is number => value !== null)
            return values.length > 0
              ? {
                  year,
                  employed: Math.round(
                    values.reduce((sum, value) => sum + value, 0) /
                      values.length,
                  ),
                  monthsReported: values.length,
                }
              : null
          })
          .filter(
            (
              item,
            ): item is {
              year: number
              employed: number
              monthsReported: number
            } => item !== null,
          )
          .map((item, index, values) => ({
            ...item,
            changePercent:
              index === 0
                ? null
                : ((item.employed - values[index - 1].employed) /
                    values[index - 1].employed) *
                  100,
          }))
        return employment && rate
          ? {
              employment: numberValue(employment.value),
              unemployment: numberValue(unemployment?.value),
              unemploymentRate: numberValue(rate.value),
              laborForce: numberValue(laborForce?.value),
              period: `${employment.periodName} ${employment.year}`,
              geography: `${city}, ${state}`,
              annualEmployment,
            }
          : null
      })()

      const qcewPromise = (async () => {
        const candidates = [
          [2025, 4],
          [2025, 3],
          [2025, 2],
          [2025, 1],
          [2024, 4],
        ] as const
        const results = await Promise.all(
          candidates.map(async ([year, quarter]) => {
            try {
              const result = await timedFetch(
                `https://data.bls.gov/cew/data/api/${year}/${quarter}/area/${countyFips}.csv`,
              )
              if (!result.ok) return null
              const lines = (await result.text()).trim().split(/\r?\n/)
              const parse = (line: string) =>
                line
                  .match(/("[^"]*"|[^,]+)(?=,|$)/g)
                  ?.map((item) => item.replace(/^"|"$/g, '').trim()) ?? []
              const headers = parse(lines[0])
              const records = lines.slice(1).map(parse)
              const get = (row: string[], field: string) =>
                row[headers.indexOf(field)]
              const total = records.find(
                (row) =>
                  get(row, 'own_code') === '0' &&
                  get(row, 'industry_code') === '10',
              )
              if (!total) return null
              const employmentValues = [
                'month1_emplvl',
                'month2_emplvl',
                'month3_emplvl',
              ].map((field) => numberValue(get(total, field)) ?? 0)
              return {
                period: `${year} Q${quarter}`,
                geography: geography.County?.name ?? countyFips,
                employment: Math.round(
                  employmentValues.reduce((sum, value) => sum + value, 0) / 3,
                ),
                averageWeeklyWage: numberValue(get(total, 'avg_wkly_wage')),
                employmentGrowthPercent: numberValue(
                  get(total, 'oty_month3_emplvl_pct_chg') ??
                    get(total, 'oty_qtrly_emplvl_pct_chg'),
                ),
              }
            } catch {
              return null
            }
          }),
        )
        return results.find((result) => result !== null) ?? null
      })()

      const qwiPromise = (async () => {
        if (!censusKey || !countyCode) return null
        const candidates = [
          [2025, 2],
          [2025, 1],
          [2024, 4],
          [2024, 3],
        ] as const
        const results = await Promise.all(
          candidates.map(async ([year, quarter]) => {
            try {
              const url = new URL(
                'https://api.census.gov/data/timeseries/qwi/rh',
              )
              url.searchParams.set('get', 'Emp,HirA,Sep,EarnS')
              url.searchParams.set('for', `county:${countyCode}`)
              url.searchParams.set('in', `state:${stateFips}`)
              url.searchParams.set('year', String(year))
              url.searchParams.set('quarter', String(quarter))
              url.searchParams.set('key', censusKey)
              const result = await timedFetch(url)
              if (!result.ok) return null
              const rows = (await result.json()) as string[][]
              if (!rows[1]) return null
              return {
                period: `${year} Q${quarter}`,
                geography: geography.County?.name ?? countyFips,
                employment: numberValue(rows[1][0]),
                hires: numberValue(rows[1][1]),
                separations: numberValue(rows[1][2]),
                averageMonthlyEarnings: numberValue(rows[1][3]),
              }
            } catch {
              return null
            }
          }),
        )
        return results.find((result) => result !== null) ?? null
      })()

      const beaPromise = (async () => {
        if (!beaKey || !countyFips) return null
        const url = new URL('https://apps.bea.gov/api/data')
        Object.entries({
          UserID: beaKey,
          method: 'GetData',
          datasetname: 'Regional',
          TableName: 'CAGDP9',
          LineCode: '1',
          GeoFIPS: countyFips,
          Year: 'LAST5',
          ResultFormat: 'JSON',
        }).forEach(([key, value]) => url.searchParams.set(key, value))
        const result = (await (await timedFetch(url)).json()) as {
          BEAAPI?: {
            Results?: {
              Data?: {
                GeoName: string
                TimePeriod: string
                DataValue: string
              }[]
            }
          }
        }
        const values = result.BEAAPI?.Results?.Data ?? []
        const latest = values.at(-1)
        const previous = values.at(-2)
        const latestValue = numberValue(latest?.DataValue)
        const previousValue = numberValue(previous?.DataValue)
        return latest && latestValue !== null && previousValue
          ? {
              year: Number(latest.TimePeriod),
              geography: latest.GeoName,
              realGdp: latestValue,
              growthPercent:
                ((latestValue - previousValue) / previousValue) * 100,
            }
          : null
      })()

      const [lausResult, qcewResult, qwiResult, beaResult] =
        await Promise.allSettled([
          lausPromise,
          qcewPromise,
          qwiPromise,
          beaPromise,
        ])
      const laus = lausResult.status === 'fulfilled' ? lausResult.value : null
      const qcew = qcewResult.status === 'fulfilled' ? qcewResult.value : null
      const qwi = qwiResult.status === 'fulfilled' ? qwiResult.value : null
      const bea = beaResult.status === 'fulfilled' ? beaResult.value : null
      const body = JSON.stringify({
        county: geography.County?.name,
        minimumWage: stateMinimumWage
          ? {
              ...stateMinimumWage,
              effectiveDate: MINIMUM_WAGE_EFFECTIVE_DATE,
              geography: `${geography.State?.name ?? state} state baseline`,
              sourceName: 'U.S. Department of Labor Wage and Hour Division',
              sourceUrl: MINIMUM_WAGE_SOURCE,
            }
          : null,
        laus,
        qcew,
        qwi,
        bea,
      })
      cache.set(cacheKey, {
        body,
        expiresAt: Date.now() + 6 * 60 * 60 * 1000,
      })
      response.setHeader('Cache-Control', 'private, max-age=21600')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'Current economic data is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-current-economy-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

const majorEmployersProxy = (): Plugin => {
  const cache = new Map<string, ProxyCacheEntry>()
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/major-employers') return next()
    response.setHeader('Content-Type', 'application/json')
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Valid coordinates are required.' }))
      return
    }
    const cacheKey = `${latitude}|${longitude}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(cached.body)
      return
    }
    const query = `
      SELECT DISTINCT ?company ?companyLabel ?description ?website ?logo
        ?employees ?industryLabel ?distance
      WHERE {
        ?company wdt:P159 ?headquarters.
        SERVICE wikibase:around {
          ?headquarters wdt:P625 ?coordinate.
          bd:serviceParam wikibase:center "Point(${longitude} ${latitude})"^^geo:wktLiteral;
                          wikibase:radius "85";
                          wikibase:distance ?distance.
        }
        ?company wdt:P1128 ?employees.
        FILTER(?employees >= 1000)
        OPTIONAL { ?company wdt:P452 ?industry. }
        OPTIONAL { ?company wdt:P856 ?website. }
        OPTIONAL { ?company wdt:P154 ?logo. }
        OPTIONAL {
          ?company schema:description ?description.
          FILTER(LANG(?description) = "en")
        }
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "en".
        }
      }
      ORDER BY DESC(?employees)
      LIMIT 60`
    const upstream = new URL('https://query.wikidata.org/sparql')
    upstream.searchParams.set('query', query)
    upstream.searchParams.set('format', 'json')
    try {
      const result = await timedFetch(upstream, {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': 'HomeIntel/0.1 (city research application)',
        },
      })
      const body = await result.text()
      response.statusCode = result.status
      if (result.ok)
        cache.set(cacheKey, {
          body,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(JSON.stringify({ error: 'Wikidata is unavailable.' }))
    }
  }
  return {
    name: 'homeintel-major-employers-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

const federalContractorsProxy = (): Plugin => {
  const cache = new Map<string, ProxyCacheEntry>()
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/federal-contractors') return next()
    response.setHeader('Content-Type', 'application/json')
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Valid coordinates are required.' }))
      return
    }
    const cacheKey = `${latitude}|${longitude}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(cached.body)
      return
    }
    try {
      const latitudeOffset = 45 / 69
      const longitudeOffset = 45 / (69 * Math.cos((latitude * Math.PI) / 180))
      const samples = [
        [latitude, longitude],
        [latitude + latitudeOffset, longitude],
        [latitude - latitudeOffset, longitude],
        [latitude, longitude + longitudeOffset],
        [latitude, longitude - longitudeOffset],
      ]
      const geographyResults = await Promise.allSettled(
        samples.map(async ([lat, lon]) => {
          const result = await timedFetch(
            `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lon}&format=json`,
          )
          return (await result.json()) as {
            County?: { FIPS?: string; name?: string }
            State?: { code?: string }
          }
        }),
      )
      const geographies = geographyResults.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      const locations = new Map<
        string,
        { country: string; state: string; county: string }
      >()
      for (const geography of geographies) {
        const fips = geography.County?.FIPS
        const state = geography.State?.code
        if (fips && state)
          locations.set(fips, { country: 'USA', state, county: fips.slice(2) })
      }
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setFullYear(startDate.getFullYear() - 3)
      const upstream = await timedFetch(
        'https://api.usaspending.gov/api/v2/search/spending_by_category/recipient/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: {
              time_period: [
                {
                  start_date: startDate.toISOString().slice(0, 10),
                  end_date: endDate.toISOString().slice(0, 10),
                },
              ],
              place_of_performance_locations: [...locations.values()],
              award_type_codes: ['A', 'B', 'C', 'D'],
            },
            category: 'recipient',
            limit: 60,
            page: 1,
            spending_level: 'transactions',
          }),
        },
      )
      if (!upstream.ok) {
        response.statusCode = upstream.status
        response.end(await upstream.text())
        return
      }
      const spending = (await upstream.json()) as {
        results?: {
          recipient_id: string
          name: string
          amount: number
          website?: string
          description?: string
        }[]
        [key: string]: unknown
      }
      const body = JSON.stringify(spending)
      cache.set(cacheKey, {
        body,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'USAspending data is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-federal-contractors-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

const majorHospitalsProxy = (): Plugin => {
  const cache = new Map<string, ProxyCacheEntry>()
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/major-hospitals') return next()
    response.setHeader('Content-Type', 'application/json')
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Valid coordinates are required.' }))
      return
    }
    const cacheKey = `${latitude}|${longitude}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(cached.body)
      return
    }
    try {
      const upstream = new URL(
        'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Hospitals_hifld/FeatureServer/0/query',
      )
      Object.entries({
        where: "STATUS = 'OPEN'",
        geometry: `${longitude},${latitude}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: '50',
        units: 'esriSRUnit_StatuteMile',
        outFields:
          'ID,NAME,ADDRESS,CITY,STATE,TYPE,STATUS,WEBSITE,OWNER,TTL_STAFF,BEDS,TRAUMA,LATITUDE,LONGITUDE',
        returnGeometry: 'false',
        f: 'json',
      }).forEach(([key, value]) => upstream.searchParams.set(key, value))
      const result = await timedFetch(upstream)
      const body = await result.text()
      response.statusCode = result.status
      if (result.ok)
        cache.set(cacheKey, {
          body,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'Hospital information is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-major-hospitals-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

type TomTomRoutePayload = {
  routes?: {
    summary: {
      lengthInMeters: number
      travelTimeInSeconds: number
      trafficDelayInSeconds?: number
      noTrafficTravelTimeInSeconds?: number
      historicTrafficTravelTimeInSeconds?: number
      liveTrafficIncidentsTravelTimeInSeconds?: number
    }
    legs?: { points?: { latitude: number; longitude: number }[] }[]
  }[]
}

type OsrmRoutePayload = {
  routes?: {
    distance: number
    duration: number
    geometry?: { coordinates?: [number, number][] }
  }[]
}

type OverpassPayload = {
  elements?: {
    id: number
    lat?: number
    lon?: number
    center?: { lat: number; lon: number }
    tags?: Record<string, string>
  }[]
}

const trafficCommuteProxy = (tomTomApiKey: string): Plugin => {
  const routeCache = new Map<string, ProxyCacheEntry>()
  const transitCache = new Map<string, ProxyCacheEntry>()
  const coordinate = (requestUrl: URL, name: string) =>
    Number(requestUrl.searchParams.get(name))
  const validPoint = (latitude: number, longitude: number) =>
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  const nextWeekday = () => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() + 1)
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6)
      date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
  }
  const fetchTomTomRoute = async (
    originLatitude: number,
    originLongitude: number,
    destinationLatitude: number,
    destinationLongitude: number,
    departAt: string,
  ) => {
    const locations = `${originLatitude},${originLongitude}:${destinationLatitude},${destinationLongitude}`
    const upstream = new URL(
      `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json`,
    )
    Object.entries({
      key: tomTomApiKey,
      traffic: 'true',
      travelMode: 'car',
      routeType: 'fastest',
      routeRepresentation: 'polyline',
      computeTravelTimeFor: 'all',
      departAt,
    }).forEach(([key, value]) => upstream.searchParams.set(key, value))
    const result = await timedFetch(upstream, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!result.ok)
      throw new Error(`Traffic route failed with ${result.status}`)
    const payload = (await result.json()) as TomTomRoutePayload
    const route = payload.routes?.[0]
    if (!route) throw new Error('No traffic route was returned.')
    return route
  }
  const fetchOsrmFallback = async (
    originLatitude: number,
    originLongitude: number,
    destinationLatitude: number,
    destinationLongitude: number,
  ) => {
    const upstream = new URL(
      `https://router.project-osrm.org/route/v1/driving/${originLongitude},${originLatitude};${destinationLongitude},${destinationLatitude}`,
    )
    upstream.searchParams.set('overview', 'full')
    upstream.searchParams.set('geometries', 'geojson')
    const result = await timedFetch(upstream, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!result.ok) throw new Error('Fallback routing is unavailable.')
    const payload = (await result.json()) as OsrmRoutePayload
    const route = payload.routes?.[0]
    if (!route) throw new Error('No fallback route was returned.')
    return {
      provider: 'OSRM',
      trafficAvailable: false,
      distanceMeters: route.distance,
      travelTimeSeconds: route.duration,
      freeFlowTimeSeconds: route.duration,
      trafficDelaySeconds: 0,
      points: (route.geometry?.coordinates ?? []).map(
        ([longitude, latitude]) => ({ latitude, longitude }),
      ),
      profiles: [],
      note: tomTomApiKey
        ? 'Live traffic was temporarily unavailable; showing a baseline route.'
        : 'Add TOMTOM_API_KEY to enable live and historical traffic estimates.',
    }
  }

  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (
      requestUrl.pathname !== '/api/traffic-route' &&
      requestUrl.pathname !== '/api/transit-options'
    )
      return next()

    response.setHeader('Content-Type', 'application/json')
    const originLatitude = coordinate(requestUrl, 'originLat')
    const originLongitude = coordinate(requestUrl, 'originLon')
    const destinationLatitude = coordinate(requestUrl, 'destinationLat')
    const destinationLongitude = coordinate(requestUrl, 'destinationLon')
    if (
      !validPoint(originLatitude, originLongitude) ||
      !validPoint(destinationLatitude, destinationLongitude)
    ) {
      response.statusCode = 400
      response.end(
        JSON.stringify({ error: 'Valid route coordinates are required.' }),
      )
      return
    }

    const cacheKey = [
      originLatitude.toFixed(4),
      originLongitude.toFixed(4),
      destinationLatitude.toFixed(4),
      destinationLongitude.toFixed(4),
    ].join('|')

    if (requestUrl.pathname === '/api/traffic-route') {
      const cached = routeCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        response.setHeader('Cache-Control', 'private, max-age=120')
        response.end(cached.body)
        return
      }
      try {
        let resultBody: object
        if (!tomTomApiKey) {
          resultBody = await fetchOsrmFallback(
            originLatitude,
            originLongitude,
            destinationLatitude,
            destinationLongitude,
          )
        } else {
          try {
            const date = nextWeekday()
            const sampleTimes = [
              '06:30',
              '07:30',
              '08:30',
              '16:00',
              '17:00',
              '18:00',
            ]
            const [currentResult, ...sampleResults] = await Promise.allSettled([
              fetchTomTomRoute(
                originLatitude,
                originLongitude,
                destinationLatitude,
                destinationLongitude,
                'now',
              ),
              ...sampleTimes.map((time) =>
                fetchTomTomRoute(
                  originLatitude,
                  originLongitude,
                  destinationLatitude,
                  destinationLongitude,
                  `${date}T${time}:00`,
                ),
              ),
            ])
            if (currentResult.status === 'rejected') throw currentResult.reason
            const current = currentResult.value
            const summary = current.summary
            resultBody = {
              provider: 'TomTom',
              trafficAvailable: true,
              distanceMeters: summary.lengthInMeters,
              travelTimeSeconds: summary.travelTimeInSeconds,
              freeFlowTimeSeconds:
                summary.noTrafficTravelTimeInSeconds ??
                summary.travelTimeInSeconds -
                  (summary.trafficDelayInSeconds ?? 0),
              trafficDelaySeconds: Math.max(
                summary.trafficDelayInSeconds ?? 0,
                summary.travelTimeInSeconds -
                  (summary.noTrafficTravelTimeInSeconds ??
                    summary.travelTimeInSeconds),
              ),
              points: (current.legs ?? []).flatMap((leg) => leg.points ?? []),
              profiles: sampleResults.flatMap((result, index) =>
                result.status === 'fulfilled'
                  ? [
                      {
                        time: sampleTimes[index],
                        travelTimeSeconds:
                          result.value.summary
                            .historicTrafficTravelTimeInSeconds ??
                          result.value.summary.travelTimeInSeconds,
                        freeFlowTimeSeconds:
                          result.value.summary.noTrafficTravelTimeInSeconds ??
                          result.value.summary.travelTimeInSeconds,
                      },
                    ]
                  : [],
              ),
              note: `Typical weekday estimates sampled for ${date}; current conditions use live traffic. ${sampleResults.filter((result) => result.status === 'fulfilled').length} of ${sampleTimes.length} rush-hour samples were available.`,
            }
          } catch {
            resultBody = await fetchOsrmFallback(
              originLatitude,
              originLongitude,
              destinationLatitude,
              destinationLongitude,
            )
          }
        }
        const body = JSON.stringify(resultBody)
        routeCache.set(cacheKey, {
          body,
          expiresAt: Date.now() + 2 * 60 * 1000,
        })
        response.setHeader('Cache-Control', 'private, max-age=120')
        response.end(body)
      } catch {
        response.statusCode = 502
        response.end(
          JSON.stringify({ error: 'Commute routing is unavailable.' }),
        )
      }
      return
    }

    const cached = transitCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(cached.body)
      return
    }
    try {
      const query = `[out:json][timeout:18];(nwr(around:2500,${originLatitude},${originLongitude})[highway=bus_stop];nwr(around:2500,${originLatitude},${originLongitude})[railway~"station|halt|tram_stop|subway_entrance"];nwr(around:2500,${destinationLatitude},${destinationLongitude})[highway=bus_stop];nwr(around:2500,${destinationLatitude},${destinationLongitude})[railway~"station|halt|tram_stop|subway_entrance"];);out center tags 60;`
      const upstream = new URL('https://overpass-api.de/api/interpreter')
      upstream.searchParams.set('data', query)
      const result = await timedFetch(upstream, {
        headers: { 'User-Agent': 'HomeIntel/0.1 transit-discovery' },
        signal: AbortSignal.timeout(22_000),
      })
      if (!result.ok) throw new Error('Transit discovery failed.')
      const payload = (await result.json()) as OverpassPayload
      const places = (payload.elements ?? []).flatMap((element) => {
        const latitude = element.lat ?? element.center?.lat
        const longitude = element.lon ?? element.center?.lon
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
        const tags = element.tags ?? {}
        const mode = tags.railway
          ? tags.railway === 'subway_entrance'
            ? 'Subway'
            : tags.railway === 'tram_stop'
              ? 'Tram'
              : 'Train'
          : 'Bus'
        return [
          {
            id: `${mode}-${element.id}`,
            name: tags.name || `${mode} stop`,
            mode,
            latitude,
            longitude,
            operator: tags.operator || '',
          },
        ]
      })
      const body = JSON.stringify({ places })
      transitCache.set(cacheKey, {
        body,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'Nearby transit information is unavailable.' }),
      )
    }
  }

  return {
    name: 'homeintel-traffic-commute-proxy',
    configureServer: (server) => {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handleRequest)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiKey = env.DATA_GOV_API_KEY || env.VITE_DATA_GOV_API_KEY || ''
  const censusKey = env.VITE_CENSUS_API_KEY || ''
  const beaKey = env.BEA_API_KEY || ''
  const tomTomApiKey = env.TOMTOM_API_KEY || ''
  return {
    resolve: {
      alias: {
        App: '/src/App.tsx',
        assets: '/src/assets',
        components: '/src/components',
        data: '/src/data',
        hooks: '/src/hooks',
        pages: '/src/pages',
        services: '/src/services',
        store: '/src/store',
        'styles.css': '/src/styles.css',
        utils: '/src/utils',
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      fbiCrimeProxy(apiKey),
      collegeScorecardProxy(apiKey),
      nearbySchoolsProxy(),
      currentEconomyProxy(censusKey, beaKey),
      majorEmployersProxy(),
      federalContractorsProxy(),
      majorHospitalsProxy(),
      trafficCommuteProxy(tomTomApiKey),
    ],
  }
})
