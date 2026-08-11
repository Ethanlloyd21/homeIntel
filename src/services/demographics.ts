import type { City } from '../data/cities'

type CensusRow = string[]

type PopulationEstimateDataset = {
  places: {
    place: string
    state: string
    population2024: number
    population2025: number
  }[]
}

export type DemographicsData = {
  population: number
  medianHouseholdIncome: number
  medianAge: number
  employmentRate: number
  collegeEducatedPercent: number
  populationGrowthPercent: number
  previousPopulation: number
  estimatedCurrentPopulation: number
  estimatedCurrentGrowthPercent: number
  annualPopulationGrowthPercent: number
  estimateYear: number
  currentPopulationNote: string
  averageHouseholdSize: number
  foreignBornPercent: number
  sourceName: string
}

const variables = [
  'NAME',
  'B01003_001E',
  'B19013_001E',
  'B01002_001E',
  'B23025_003E',
  'B23025_004E',
  'B15003_001E',
  'B15003_022E',
  'B15003_023E',
  'B15003_024E',
  'B15003_025E',
  'B25010_001E',
  'B05002_001E',
  'B05002_013E',
].join(',')

function estimate(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function calculateCurrentPopulationEstimate(
  population2024: number,
  population2025: number,
  targetYear = new Date().getFullYear(),
) {
  if (population2024 <= 0 || population2025 <= 0 || targetYear <= 2025) {
    return Math.round(population2025)
  }

  const annualGrowthRate = population2025 / population2024 - 1
  const elapsedYears = targetYear - 2025

  return Math.round(
    population2025 * Math.pow(1 + annualGrowthRate, elapsedYears),
  )
}

function normalizePlace(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(city|town|village|borough|municipality|balance)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export async function fetchDemographics(city: City, signal: AbortSignal) {
  if (city.country !== 'United States') {
    throw new Error('Census demographics are available for U.S. cities only.')
  }

  const apiKey = import.meta.env.VITE_CENSUS_API_KEY
  if (!apiKey) throw new Error('Census API key is not configured.')

  const key = `&key=${encodeURIComponent(apiKey)}`
  const statesResponse = await fetch(
    `https://api.census.gov/data/2024/acs/acs5?get=NAME&for=state:*${key}`,
    { signal },
  )
  if (!statesResponse.ok) throw new Error('Unable to identify Census state.')
  const states = (await statesResponse.json()) as CensusRow[]
  const state = states.slice(1).find(([name]) => name === city.state)
  if (!state) throw new Error('No Census state matched this location.')

  const placesResponse = await fetch(
    `https://api.census.gov/data/2024/acs/acs5?get=${variables}&for=place:*&in=state:${state[1]}${key}`,
    { signal },
  )
  if (!placesResponse.ok) throw new Error('Unable to load Census demographics.')
  const rows = (await placesResponse.json()) as CensusRow[]
  const headers = rows[0]
  const cityName = city.name.toLowerCase()
  const place = rows
    .slice(1)
    .find(([name]) => name.toLowerCase().startsWith(`${cityName} `))
  if (!place) throw new Error('No Census place matched this city.')
  const value = (variable: string) => place[headers.indexOf(variable)]
  const placeCode = place[headers.indexOf('place')]

  const previousResponse = await fetch(
    `https://api.census.gov/data/2019/acs/acs5?get=B01003_001E&for=place:${placeCode}&in=state:${state[1]}${key}`,
    { signal },
  )
  const previousRows = previousResponse.ok
    ? ((await previousResponse.json()) as CensusRow[])
    : []
  const currentPopulation = estimate(value('B01003_001E'))
  const previousPopulation = estimate(previousRows[1]?.[0] ?? '0')
  const populationResponse = await fetch(
    `${import.meta.env.BASE_URL}data/census-population-2025.json`,
    { signal },
  )
  const populationDataset = populationResponse.ok
    ? ((await populationResponse.json()) as PopulationEstimateDataset)
    : { places: [] }
  const placeEstimate = populationDataset.places.find(
    (item) =>
      item.state === city.state &&
      normalizePlace(item.place) === normalizePlace(city.name),
  )
  const population2024 = placeEstimate?.population2024 ?? currentPopulation
  const population2025 = placeEstimate?.population2025 ?? currentPopulation
  const estimateYear = new Date().getFullYear()
  const estimatedCurrentPopulation = calculateCurrentPopulationEstimate(
    population2024,
    population2025,
    estimateYear,
  )

  const laborForce = estimate(value('B23025_003E'))
  const employed = estimate(value('B23025_004E'))
  const adults25AndOlder = estimate(value('B15003_001E'))
  const collegeEducated =
    estimate(value('B15003_022E')) +
    estimate(value('B15003_023E')) +
    estimate(value('B15003_024E')) +
    estimate(value('B15003_025E'))
  const nativityPopulation = estimate(value('B05002_001E'))
  const foreignBorn = estimate(value('B05002_013E'))

  return {
    population: currentPopulation,
    medianHouseholdIncome: estimate(value('B19013_001E')),
    medianAge: estimate(value('B01002_001E')),
    employmentRate: laborForce > 0 ? (employed / laborForce) * 100 : 0,
    collegeEducatedPercent:
      adults25AndOlder > 0 ? (collegeEducated / adults25AndOlder) * 100 : 0,
    populationGrowthPercent:
      previousPopulation > 0
        ? ((currentPopulation - previousPopulation) / previousPopulation) * 100
        : 0,
    previousPopulation,
    estimatedCurrentPopulation,
    estimatedCurrentGrowthPercent:
      previousPopulation > 0
        ? ((estimatedCurrentPopulation - previousPopulation) /
            previousPopulation) *
          100
        : 0,
    annualPopulationGrowthPercent:
      population2024 > 0
        ? ((population2025 - population2024) / population2024) * 100
        : 0,
    estimateYear,
    currentPopulationNote: placeEstimate
      ? `${estimateYear} calculated from Census 2024–2025 growth`
      : '2024 ACS estimate; 2025 city estimate unavailable',
    averageHouseholdSize: estimate(value('B25010_001E')),
    foreignBornPercent:
      nativityPopulation > 0 ? (foreignBorn / nativityPopulation) * 100 : 0,
    sourceName: place[0],
  } satisfies DemographicsData
}
