import { publicCities } from 'data/publicCities'
import type { City, GeocodingResult } from 'data/cities'

export const viewPaths: Record<string, string> = {
  Overview: '/overview',
  Housing: '/housing',
  People: '/people',
  Employment: '/employment',
  Risk: '/risk',
  Environment: '/environment',
  Neighborhoods: '/neighborhoods',
  Simulator: '/life-simulator',
  DayInLife: '/day-in-the-life',
  Brief: '/decision-brief',
  MovePlan: '/move-plan',
  Compare: '/compare-cities',
}

export const normalizePath = (path: string) =>
  path.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/'

export const viewFromPath = (pathname: string) =>
  Object.entries(viewPaths).find(
    ([, path]) => path === normalizePath(pathname),
  )?.[0] ?? 'Overview'

export const cityFromSearch = (search: string): GeocodingResult | null => {
  const params = new URLSearchParams(search)
  const key = params.get('city')
  const known = publicCities.find((city) => city.slug === key)
  if (known) return known
  if (!key || !/^\d{1,12}$/.test(key)) return null
  const name = params.get('name')?.trim()
  const state = params.get('state')?.trim()
  const country = params.get('country')?.trim()
  const timezone = params.get('tz')?.trim()
  const lat = params.get('lat')
  const lon = params.get('lon')
  const latitude = Number(lat)
  const longitude = Number(lon)
  if (
    !name ||
    name.length > 120 ||
    !state ||
    state.length > 120 ||
    !country ||
    country.length > 120 ||
    !lat ||
    !lon ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    return null
  try {
    if (timezone) new Intl.DateTimeFormat('en', { timeZone: timezone })
  } catch {
    return null
  }
  return {
    id: Number(key),
    name,
    admin1: state,
    country,
    latitude,
    longitude,
    timezone: timezone || 'auto',
  }
}

// Share only destination coordinates and labels, never household inputs or addresses.
export const workspacePath = (view: string, city: City | null) => {
  const path = viewPaths[view] ?? '/overview'
  if (!city) return path
  const known = publicCities.find((entry) => String(entry.id) === city.id)
  const params = known
    ? new URLSearchParams({ city: known.slug })
    : new URLSearchParams({
        city: city.id,
        name: city.name,
        state: city.state,
        country: city.country,
        lat: String(city.latitude),
        lon: String(city.longitude),
        ...(city.timezone && city.timezone !== 'auto'
          ? { tz: city.timezone }
          : {}),
      })
  return `${path}?${params}`
}
