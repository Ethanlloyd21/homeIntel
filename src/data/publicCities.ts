import type { GeocodingResult } from 'data/cities'

export type PublicCity = GeocodingResult & { slug: string; stateCode: string }

// A small, curated directory: publish useful sourced pages, not every search result.
export const publicCities: PublicCity[] = [
  {
    id: 4671654,
    slug: 'austin-texas',
    name: 'Austin',
    admin1: 'Texas',
    stateCode: 'TX',
    country: 'United States',
    latitude: 30.2672,
    longitude: -97.7431,
    timezone: 'America/Chicago',
  },
  {
    id: 4887398,
    slug: 'chicago-illinois',
    name: 'Chicago',
    admin1: 'Illinois',
    stateCode: 'IL',
    country: 'United States',
    latitude: 41.85,
    longitude: -87.65,
    timezone: 'America/Chicago',
  },
  {
    id: 5419384,
    slug: 'denver-colorado',
    name: 'Denver',
    admin1: 'Colorado',
    stateCode: 'CO',
    country: 'United States',
    latitude: 39.7392,
    longitude: -104.9903,
    timezone: 'America/Denver',
  },
  {
    id: 4487042,
    slug: 'raleigh-north-carolina',
    name: 'Raleigh',
    admin1: 'North Carolina',
    stateCode: 'NC',
    country: 'United States',
    latitude: 35.7721,
    longitude: -78.6386,
    timezone: 'America/New_York',
  },
  {
    id: 5391959,
    slug: 'san-francisco-california',
    name: 'San Francisco',
    admin1: 'California',
    stateCode: 'CA',
    country: 'United States',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 5809844,
    slug: 'seattle-washington',
    name: 'Seattle',
    admin1: 'Washington',
    stateCode: 'WA',
    country: 'United States',
    latitude: 47.6062,
    longitude: -122.3321,
    timezone: 'America/Los_Angeles',
  },
]

export const cityGuidePath = (city: PublicCity) => `/cities/${city.slug}/`

export type PublicMarket = {
  city: string
  state: string
  homeValue?: number
  homeValueDate?: string
  rent?: number
  rentDate?: string
}

export type PublicData = { updatedAt?: string; markets: PublicMarket[] }
