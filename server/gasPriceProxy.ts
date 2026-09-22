import { upstreamFetch } from './upstreamFetch.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type GasPriceScope = 'metro' | 'state' | 'region'

type GasPriceGeography = {
  area: string
  label: string
  scope: GasPriceScope
}

type EiaGasPriceRow = {
  period?: string
  'area-name'?: string
  value?: string | number
  units?: string
}

const stateCodes: Record<string, string> = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  'DISTRICT OF COLUMBIA': 'DC',
}

const metroAreas: Record<string, GasPriceGeography> = {
  'BOSTON|MA': { area: 'BOSTON', label: 'Boston area', scope: 'metro' },
  'CHICAGO|IL': { area: 'CHICAGO', label: 'Chicago area', scope: 'metro' },
  'CLEVELAND|OH': {
    area: 'CLEVELAND',
    label: 'Cleveland area',
    scope: 'metro',
  },
  'DENVER|CO': { area: 'DENVER', label: 'Denver area', scope: 'metro' },
  'HOUSTON|TX': { area: 'HOUSTON', label: 'Houston area', scope: 'metro' },
  'LOS ANGELES|CA': {
    area: 'LOS ANGELES',
    label: 'Los Angeles area',
    scope: 'metro',
  },
  'MIAMI|FL': { area: 'MIAMI', label: 'Miami area', scope: 'metro' },
  'NEW YORK|NY': {
    area: 'NEW YORK CITY',
    label: 'New York City area',
    scope: 'metro',
  },
  'NEW YORK CITY|NY': {
    area: 'NEW YORK CITY',
    label: 'New York City area',
    scope: 'metro',
  },
  'SAN FRANCISCO|CA': {
    area: 'SAN FRANCISCO',
    label: 'San Francisco area',
    scope: 'metro',
  },
  'SEATTLE|WA': { area: 'SEATTLE', label: 'Seattle area', scope: 'metro' },
}

const stateAreas: Record<string, GasPriceGeography> = {
  CA: { area: 'CALIFORNIA', label: 'California', scope: 'state' },
  CO: { area: 'COLORADO', label: 'Colorado', scope: 'state' },
  FL: { area: 'FLORIDA', label: 'Florida', scope: 'state' },
  MA: { area: 'MASSACHUSETTS', label: 'Massachusetts', scope: 'state' },
  MN: { area: 'MINNESOTA', label: 'Minnesota', scope: 'state' },
  NY: { area: 'NEW YORK', label: 'New York state', scope: 'state' },
  OH: { area: 'OHIO', label: 'Ohio', scope: 'state' },
  TX: { area: 'TEXAS', label: 'Texas', scope: 'state' },
  WA: { area: 'WASHINGTON', label: 'Washington state', scope: 'state' },
}

const regionalAreas: Array<{
  states: string[]
  geography: GasPriceGeography
}> = [
  {
    states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'],
    geography: { area: 'PADD 1A', label: 'New England', scope: 'region' },
  },
  {
    states: ['DE', 'DC', 'MD', 'NJ', 'NY', 'PA'],
    geography: {
      area: 'PADD 1B',
      label: 'Central Atlantic',
      scope: 'region',
    },
  },
  {
    states: ['FL', 'GA', 'NC', 'SC', 'VA', 'WV'],
    geography: {
      area: 'PADD 1C',
      label: 'Lower Atlantic',
      scope: 'region',
    },
  },
  {
    states: [
      'IA',
      'IL',
      'IN',
      'KS',
      'KY',
      'MI',
      'MN',
      'MO',
      'NE',
      'ND',
      'OH',
      'OK',
      'SD',
      'TN',
      'WI',
    ],
    geography: { area: 'PADD 2', label: 'Midwest', scope: 'region' },
  },
  {
    states: ['AL', 'AR', 'LA', 'MS', 'NM', 'TX'],
    geography: { area: 'PADD 3', label: 'Gulf Coast', scope: 'region' },
  },
  {
    states: ['CO', 'ID', 'MT', 'UT', 'WY'],
    geography: { area: 'PADD 4', label: 'Rocky Mountain', scope: 'region' },
  },
  {
    states: ['AK', 'AZ', 'HI', 'NV', 'OR', 'WA'],
    geography: {
      area: 'PADD 5 EXCEPT CALIFORNIA',
      label: 'West Coast excluding California',
      scope: 'region',
    },
  },
]

const normalizeState = (state: string) => {
  const normalized = state.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(normalized) ? normalized : stateCodes[normalized]
}

export const gasPriceGeography = (
  city: string,
  state: string,
): GasPriceGeography | null => {
  const stateCode = normalizeState(state)
  if (!stateCode) return null
  const metro = metroAreas[`${city.trim().toUpperCase()}|${stateCode}`]
  if (metro) return metro
  if (stateAreas[stateCode]) return stateAreas[stateCode]
  return (
    regionalAreas.find(({ states }) => states.includes(stateCode))?.geography ??
    null
  )
}

export const gasPriceProxy = (apiKey: string): Plugin => {
  let cache: { rows: EiaGasPriceRow[]; expires: number } | null = null

  const handle = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/gas-price') return next()
    response.setHeader('Content-Type', 'application/json')

    const city = requestUrl.searchParams.get('city')?.trim() ?? ''
    const state = requestUrl.searchParams.get('state')?.trim() ?? ''
    if (!city || city.length > 80 || !state || state.length > 40) {
      response.statusCode = 400
      response.end(
        JSON.stringify({ error: 'A valid city and state are required.' }),
      )
      return
    }
    const geography = gasPriceGeography(city, state)
    if (!geography) {
      response.statusCode = 422
      response.end(
        JSON.stringify({
          error: 'EIA gas prices are available for U.S. cities.',
        }),
      )
      return
    }
    if (!apiKey) {
      response.statusCode = 503
      response.end(
        JSON.stringify({ error: 'EIA gas prices are not configured.' }),
      )
      return
    }

    try {
      if (!cache || cache.expires <= Date.now()) {
        const upstream = new URL(
          'https://api.eia.gov/v2/petroleum/pri/gnd/data/',
        )
        upstream.searchParams.set('api_key', apiKey)
        upstream.searchParams.set('frequency', 'weekly')
        upstream.searchParams.set('data[0]', 'value')
        upstream.searchParams.set('facets[product][]', 'EPMR')
        upstream.searchParams.set('sort[0][column]', 'period')
        upstream.searchParams.set('sort[0][direction]', 'desc')
        upstream.searchParams.set('offset', '0')
        upstream.searchParams.set('length', '100')
        const result = await upstreamFetch(upstream, {
          signal: AbortSignal.timeout(10_000),
        })
        if (!result.ok) throw new Error('EIA request failed')
        const payload = (await result.json()) as {
          response?: { data?: EiaGasPriceRow[] }
        }
        const rows = payload.response?.data
        if (!Array.isArray(rows) || rows.length === 0)
          throw new Error('EIA returned no prices')
        cache = { rows, expires: Date.now() + 6 * 60 * 60 * 1000 }
      }

      const row = cache.rows.find(
        (entry) =>
          entry['area-name'] === geography.area &&
          Number.isFinite(Number(entry.value)) &&
          Boolean(entry.period),
      )
      if (!row) throw new Error('The selected EIA area has no current price')

      response.setHeader('Cache-Control', 'private, max-age=21600')
      response.end(
        JSON.stringify({
          price: Number(row.value),
          period: row.period,
          area: geography.label,
          scope: geography.scope,
          units: 'USD per gallon',
          source: 'U.S. Energy Information Administration',
          sourceUrl: 'https://www.eia.gov/petroleum/gasdiesel/',
        }),
      )
    } catch {
      response.statusCode = 502
      response.setHeader('Cache-Control', 'no-store')
      response.end(
        JSON.stringify({ error: 'The latest EIA gas price is unavailable.' }),
      )
    }
  }

  return {
    name: 'homeintel-gas-price-proxy',
    configureServer: (server) => {
      server.middlewares.use(handle)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handle)
    },
  }
}
