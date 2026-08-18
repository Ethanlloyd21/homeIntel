import type { City } from 'data/cities'

type ScorecardSchool = {
  id: number
  'school.name': string
  'school.city': string
  'school.state': string
  'location.lat': number | null
  'location.lon': number | null
  'school.school_url': string | null
  'school.ownership': number | null
  'school.degrees_awarded.highest': number | null
  'latest.student.size': number | null
  [key: `latest.academics.program_percentage.${string}`]: number | null
}

type ScorecardResponse = { results?: ScorecardSchool[] }

export type NearbyCollege = {
  id: number
  name: string
  location: string
  website: string
  logoUrl: string
  enrollment: number
  type: string
  knownFor: string
  distanceMiles: number
}

const programFields = [
  ['computer', 'computer science and technology'],
  ['engineering', 'engineering'],
  ['biological', 'biological sciences'],
  ['health', 'health professions'],
  ['business_marketing', 'business and marketing'],
  ['education', 'education'],
  ['visual_performing', 'visual and performing arts'],
  ['social_science', 'social sciences'],
] as const

const normalizeWebsite = (value: string | null) => {
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const describeSchool = (school: ScorecardSchool) => {
  const strongest = programFields
    .map(([field, label]) => ({
      label,
      share: school[`latest.academics.program_percentage.${field}`] ?? 0,
    }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 2)
    .filter((program) => program.share > 0)

  if (strongest.length === 0) return 'Known for a broad range of programs.'
  return `Known for ${strongest.map((program) => program.label).join(' and ')}.`
}

const distanceInMiles = (
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

export const fetchNearbyColleges = async (city: City, signal: AbortSignal) => {
  if (city.country !== 'United States') return []
  const response = await fetch(
    `/api/nearby-colleges?city=${encodeURIComponent(city.name)}&state=${encodeURIComponent(city.state)}`,
    { signal },
  )
  if (!response.ok) throw new Error('Unable to load nearby colleges.')
  const payload = (await response.json()) as ScorecardResponse

  return (payload.results ?? [])
    .map((school) => {
      const latitude = school['location.lat']
      const longitude = school['location.lon']
      const distanceMiles =
        latitude === null || longitude === null
          ? Number.POSITIVE_INFINITY
          : distanceInMiles(city.latitude, city.longitude, latitude, longitude)
      const website = normalizeWebsite(school['school.school_url'])
      return {
        id: school.id,
        name: school['school.name'],
        location: `${school['school.city']}, ${school['school.state']}`,
        website,
        logoUrl: website
          ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(website)}&sz=128`
          : '',
        enrollment: school['latest.student.size'] ?? 0,
        type:
          school['school.ownership'] === 1
            ? 'Public college'
            : school['school.ownership'] === 2
              ? 'Private nonprofit college'
              : 'Private college',
        knownFor: describeSchool(school),
        distanceMiles,
      }
    })
    .filter((school) => school.distanceMiles <= 50)
    .sort((a, b) => {
      const popularA = Math.log10(Math.max(a.enrollment, 1)) * 15
      const popularB = Math.log10(Math.max(b.enrollment, 1)) * 15
      return (
        b.enrollment - a.enrollment ||
        popularB - popularA ||
        a.distanceMiles - b.distanceMiles
      )
    })
    .slice(0, 9) satisfies NearbyCollege[]
}
