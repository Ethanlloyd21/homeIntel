import { useMemo } from 'react'
import type { City } from 'data/cities'
import { useClimateProfileQuery } from 'hooks/useClimateProfileQuery'
import { useCommuteQuery } from 'hooks/useCommuteQuery'
import { useComparisonIndicesQuery } from 'hooks/useComparisonIndicesQuery'
import { useDemographicsQuery } from 'hooks/useDemographicsQuery'
import { useEmploymentQuery } from 'hooks/useEmploymentQuery'
import { useHousingQuery } from 'hooks/useHousingQuery'
import { useMajorEmployersQuery } from 'hooks/useMajorEmployersQuery'
import { useRiskQuery } from 'hooks/useRiskQuery'
import type { ClimateProfile } from 'services/climate'
import type { CityLifeData } from 'services/lifeSimulator'
import { minutes } from 'services/traffic'
import { useProfileStore } from 'store/useProfileStore'

export type ConfidenceLevel =
  'High' | 'Medium' | 'Estimated' | 'Loading' | 'Unavailable'

export type ConfidenceEntry = {
  label: string
  level: ConfidenceLevel
  note: string
  /** Geography the value actually describes, which is rarely the city itself. */
  geography: string
}

export type CityIntel = {
  city: City
  data: CityLifeData
  climate: ClimateProfile | null
  confidence: ConfidenceEntry[]
  nearestHospital: { name: string; miles: number } | null
  topEmployers: string[]
  commuteMinutes: number | null
  commuteMiles: number | null
  trafficDelayPercent: number | null
  transitStopCount: number
  isPending: boolean
  isFetching: boolean
}

/**
 * Every decision surface (simulator, brief, day-in-the-life, move plan) needs
 * the same bundle of city facts. Assembling it once keeps the numbers on those
 * pages identical, and keeps React Query's cache doing the deduplication.
 */
export const useCityIntel = (
  city: City | null,
  enabled = true,
): CityIntel | null => {
  const inputs = useProfileStore((state) => state.inputs)
  const anchors = useProfileStore((state) =>
    city ? state.anchors[city.id] : undefined,
  )
  const band = useMemo(
    () => ({ lowF: inputs.comfortLowF, highF: inputs.comfortHighF }),
    [inputs.comfortLowF, inputs.comfortHighF],
  )

  // A null city still has to run the same hooks in the same order, so fall back
  // to a placeholder and gate every query on `active`.
  const target = city ?? placeholderCity
  const active = enabled && Boolean(city)

  const housing = useHousingQuery(target, active)
  const demographics = useDemographicsQuery(target, active, false)
  const employment = useEmploymentQuery(target, active, false)
  const risk = useRiskQuery(target, active)
  const indices = useComparisonIndicesQuery(target, active)
  const employers = useMajorEmployersQuery(target, active)
  const climateQuery = useClimateProfileQuery(city, band, active)

  const origin =
    anchors?.home ??
    (city
      ? { latitude: city.latitude, longitude: city.longitude, label: city.name }
      : null)
  const commute = useCommuteQuery(
    origin ?? { latitude: target.latitude, longitude: target.longitude },
    active && anchors?.work ? anchors.work : null,
  )

  return useMemo(() => {
    if (!city) return null

    const costOfLivingIndex = indices.data?.costOfLivingIndex || 100
    const hospitals = employers.data
      .filter(
        (employer) =>
          employer.source === 'HIFLD' &&
          typeof employer.distanceMiles === 'number',
      )
      .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
    const nearestHospital = hospitals[0]
      ? { name: hospitals[0].name, miles: hospitals[0].distanceMiles as number }
      : null

    const route = commute.data?.route ?? null
    const commuteMinutes = route ? minutes(route.travelTimeSeconds) : null
    const trafficDelayPercent =
      route && route.freeFlowTimeSeconds > 0
        ? Math.max(
            0,
            ((route.travelTimeSeconds - route.freeFlowTimeSeconds) /
              route.freeFlowTimeSeconds) *
              100,
          )
        : null

    const data: CityLifeData = {
      name: city.name,
      medianRent:
        housing.data?.medianRent ||
        city.rent ||
        1_500 * (costOfLivingIndex / 100),
      medianHomeValue:
        housing.data?.medianHomeValue ||
        city.home ||
        300_000 * (costOfLivingIndex / 100),
      costOfLivingIndex,
      employmentRate: employment.data?.employmentRate || city.employed || 90,
      medianWorkerEarnings:
        employment.data?.medianWorkerEarnings ||
        city.income ||
        50_000 * (costOfLivingIndex / 100),
      collegeEducatedPercent:
        demographics.data?.collegeEducatedPercent || city.college,
      riskScore: risk.data?.score ?? (city.risk || 50),
      industries: employment.data?.industries ?? [],
      comfortableDaysPerYear:
        climateQuery.profile?.comfortableDaysPerYear ?? null,
      commuteMinutes,
      nearestHospitalMiles: nearestHospital?.miles ?? null,
      violentCrimeIndex: indices.data?.violentCrimeIndex ?? null,
    }

    const confidence: ConfidenceEntry[] = [
      {
        label: 'Housing',
        level: housing.isPending
          ? 'Loading'
          : housing.data?.homeValueNote.startsWith('ZHVI')
            ? 'High'
            : housing.data
              ? 'Medium'
              : 'Unavailable',
        note: housing.data?.homeValueNote ?? 'Waiting for market data',
        geography: 'City / Zillow market area',
      },
      {
        label: 'People',
        level: demographics.isPending
          ? 'Loading'
          : demographics.data
            ? 'High'
            : 'Unavailable',
        note: 'Census ACS 5-year place estimate',
        geography: 'Census place',
      },
      {
        label: 'Career',
        level: employment.isPending
          ? 'Loading'
          : employment.data
            ? 'High'
            : 'Unavailable',
        note: 'Census ACS employment profile',
        geography: 'Census place',
      },
      {
        label: 'Hazard',
        level: risk.isPending ? 'Loading' : risk.data ? 'High' : 'Unavailable',
        note: risk.data
          ? `FEMA National Risk Index ${risk.data.version}`
          : 'FEMA National Risk Index',
        geography: risk.data
          ? `Census tract ${risk.data.tract}, ${risk.data.county} County`
          : 'Census tract at the city centre',
      },
      {
        label: 'Climate',
        level: climateQuery.isPending
          ? 'Loading'
          : climateQuery.profile
            ? 'High'
            : 'Unavailable',
        note: climateQuery.profile
          ? `${climateQuery.profile.yearsObserved} years of observed daily weather`
          : 'Open-Meteo historical archive',
        geography: 'Nearest reanalysis grid cell',
      },
      {
        label: 'Living costs',
        level: indices.data?.costOfLivingIndex ? 'Medium' : 'Estimated',
        note: 'BEA regional price parity, 2024',
        geography: `${city.state} state price level`,
      },
      {
        label: 'Reported crime',
        level: indices.isPending
          ? 'Loading'
          : indices.data?.violentCrimeIndex
            ? 'Estimated'
            : 'Unavailable',
        note: 'FBI Crime Data Explorer 2023; agency reporting is incomplete',
        geography: indices.data?.crimeGeography || `${city.state} state rate`,
      },
      {
        label: 'Commute',
        level: commuteMinutes !== null ? 'High' : 'Estimated',
        note:
          commuteMinutes !== null
            ? `${route?.provider} routed trip in current traffic`
            : 'Estimated from the distance you entered',
        geography: 'Your home and workplace points',
      },
      {
        label: 'Employers & hospitals',
        level: employers.isPending
          ? 'Loading'
          : employers.data.length
            ? 'Medium'
            : 'Unavailable',
        note: 'USAspending, HIFLD and Wikidata; branch coverage is incomplete',
        geography: 'Within the metro radius',
      },
    ]

    return {
      city,
      data,
      climate: climateQuery.profile,
      confidence,
      nearestHospital,
      topEmployers: employers.data
        .filter((employer) => employer.source !== 'HIFLD')
        .slice(0, 5)
        .map((employer) => employer.name),
      commuteMinutes,
      commuteMiles: route ? route.distanceMeters / 1609.344 : null,
      trafficDelayPercent,
      transitStopCount: commute.data?.transit.length ?? 0,
      isPending:
        housing.isPending ||
        demographics.isPending ||
        employment.isPending ||
        risk.isPending,
      isFetching:
        housing.isFetching ||
        demographics.isFetching ||
        employment.isFetching ||
        risk.isFetching ||
        climateQuery.isFetching,
    }
  }, [
    city,
    housing.data,
    housing.isPending,
    housing.isFetching,
    demographics.data,
    demographics.isPending,
    demographics.isFetching,
    employment.data,
    employment.isPending,
    employment.isFetching,
    risk.data,
    risk.isPending,
    risk.isFetching,
    indices.data,
    indices.isPending,
    employers.data,
    employers.isPending,
    climateQuery.profile,
    climateQuery.isPending,
    climateQuery.isFetching,
    commute.data,
  ])
}

const placeholderCity: City = {
  id: 'placeholder',
  name: '',
  state: '',
  country: '',
  short: '',
  latitude: 0,
  longitude: 0,
  timezone: 'auto',
  population: 0,
  home: 0,
  rent: 0,
  income: 0,
  growth: 0,
  employed: 0,
  age: 0,
  college: 0,
  risk: 0,
  riskLabel: '',
  owner: 0,
  color: '#2e7da1',
  industries: [],
  risks: [],
}
