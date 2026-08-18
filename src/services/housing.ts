import type { City } from 'data/cities'

type CensusRow = string[]

export type HousingData = {
  medianHomeValue: number
  medianRent: number
  ownerOccupiedPercent: number
  sourceName: string
  homeValueNote: string
  rentNote: string
  homeValueHistory: MarketPoint[]
  rentHistory: MarketPoint[]
}

export type MarketPoint = {
  date: string
  value: number
}

type ZillowMarket = {
  city: string
  state: string
  homeValue?: number
  homeValueDate?: string
  rent?: number
  rentDate?: string
  homeValueHistory?: (number | null)[]
  rentHistory?: (number | null)[]
}

type ZillowDataset = {
  homeValueDates: string[]
  rentDates: string[]
  markets: ZillowMarket[]
}

const stateAbbreviations: Record<string, string> = {
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

const variables = [
  'NAME',
  'B25077_001E',
  'B25064_001E',
  'B25003_002E',
  'B25003_003E',
].join(',')

const toValidEstimate = (value: string) => {
  const estimate = Number(value)
  return Number.isFinite(estimate) && estimate >= 0 ? estimate : 0
}

const normalize = (value: string) => {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const formatMonth = (value?: string) => {
  if (!value) return 'latest release'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export const fetchHousingData = async (city: City, signal: AbortSignal) => {
  if (city.country !== 'United States') {
    throw new Error('Housing data is currently available for U.S. cities only.')
  }

  const apiKey = import.meta.env.VITE_CENSUS_API_KEY
  if (!apiKey) {
    throw new Error(
      'Add VITE_CENSUS_API_KEY to .env to load Census housing data.',
    )
  }

  const key = `&key=${encodeURIComponent(apiKey)}`
  const zillowResponse = await fetch(
    `${import.meta.env.BASE_URL}data/zillow-market.json`,
    { signal },
  )
  const zillowDataset: ZillowDataset = zillowResponse.ok
    ? ((await zillowResponse.json()) as ZillowDataset)
    : { homeValueDates: [], rentDates: [], markets: [] }

  const statesResponse = await fetch(
    `https://api.census.gov/data/2024/acs/acs5?get=NAME&for=state:*${key}`,
    { signal },
  )
  if (!statesResponse.ok)
    throw new Error('Unable to identify the Census state.')
  const states = (await statesResponse.json()) as CensusRow[]
  const stateRow = states.slice(1).find(([name]) => name === city.state)
  if (!stateRow) throw new Error('No Census state matched this location.')

  const stateCode = stateRow[1]
  const placesResponse = await fetch(
    `https://api.census.gov/data/2024/acs/acs5?get=${variables}&for=place:*&in=state:${stateCode}${key}`,
    { signal },
  )
  if (!placesResponse.ok) throw new Error('Unable to load Census housing data.')
  const rows = (await placesResponse.json()) as CensusRow[]
  const cityName = city.name.toLowerCase()
  const place = rows
    .slice(1)
    .find(([name]) => name.toLowerCase().startsWith(`${cityName} `))

  if (!place) throw new Error('No Census place matched this city.')

  const medianHomeValue = toValidEstimate(place[1])
  const medianRent = toValidEstimate(place[2])
  const ownerOccupied = toValidEstimate(place[3])
  const renterOccupied = toValidEstimate(place[4])
  const occupiedTotal = ownerOccupied + renterOccupied
  const zillow = zillowDataset.markets.find(
    (market) =>
      normalize(market.city) === normalize(city.name) &&
      normalize(market.state) ===
        normalize(stateAbbreviations[city.state] ?? city.state),
  )

  return {
    medianHomeValue: zillow?.homeValue ?? medianHomeValue,
    medianRent: zillow?.rent ?? medianRent,
    ownerOccupiedPercent:
      occupiedTotal > 0 ? (ownerOccupied / occupiedTotal) * 100 : 0,
    sourceName: `${place[0]} · Zillow Research`,
    homeValueNote: zillow?.homeValue
      ? `ZHVI · ${formatMonth(zillow.homeValueDate)}`
      : '2020-2024 ACS estimate',
    rentNote: zillow?.rent
      ? `ZORI · ${formatMonth(zillow.rentDate)}`
      : '2020-2024 ACS estimate',
    homeValueHistory: (zillow?.homeValueHistory ?? []).flatMap(
      (value, index) =>
        value === null || !zillowDataset.homeValueDates[index]
          ? []
          : [{ date: zillowDataset.homeValueDates[index], value }],
    ),
    rentHistory: (zillow?.rentHistory ?? []).flatMap((value, index) =>
      value === null || !zillowDataset.rentDates[index]
        ? []
        : [{ date: zillowDataset.rentDates[index], value }],
    ),
  } satisfies HousingData
}
