export type City = {
  id: string
  name: string
  state: string
  country: string
  short: string
  latitude: number
  longitude: number
  timezone: string
  population: number
  home: number
  rent: number
  income: number
  growth: number
  employed: number
  age: number
  college: number
  risk: number
  riskLabel: string
  owner: number
  color: string
  industries: string[]
  risks: { label: string; value: number; tone: string }[]
}

export type GeocodingResult = {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
  timezone?: string
  population?: number
}

export function cityFromGeocoding(result: GeocodingResult): City {
  const state = result.admin1 ?? result.country_code ?? result.country ?? ''
  const words = result.name.trim().split(/\s+/)
  const short = words
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return {
    id: String(result.id),
    name: result.name,
    state,
    country: result.country ?? '',
    short,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone ?? 'auto',
    population: result.population ?? 0,
    home: 0,
    rent: 0,
    income: 0,
    growth: 0,
    employed: 0,
    age: 0,
    college: 0,
    risk: 0,
    riskLabel: 'Not available',
    owner: 0,
    color: '#2e7da1',
    industries: [],
    risks: [],
  }
}
