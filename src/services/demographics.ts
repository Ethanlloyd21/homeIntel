import type { City } from '../data/cities'

type CensusRow = string[]

type PopulationEstimateDataset = {
  places: {
    place: string
    state: string
    population2023: number
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
  populationSeries: {
    year: number
    population: number
    calculated: boolean
  }[]
  raceDistribution: {
    label: string
    population: number
    percent: number
  }[]
  educationHouseholdComparison: {
    geography: string
    bachelorsPercent: number
    graduatePercent: number
    bachelorsOrHigherPercent: number
    averageHouseholdSize: number
  }[]
}

export type PopulationTrend = {
  population: number
  change: number
  percentChange: number
}

export function calculatePopulationFromAnchors(
  startPopulation: number,
  startYear: number,
  endPopulation: number,
  endYear: number,
  targetYear: number,
): PopulationTrend {
  if (startPopulation <= 0 || endPopulation <= 0 || endYear <= startYear) {
    return { population: 0, change: 0, percentChange: 0 }
  }

  const annualChange = (endPopulation - startPopulation) / (endYear - startYear)
  const population = Math.round(
    startPopulation + annualChange * (targetYear - startYear),
  )
  const change = population - startPopulation

  return {
    population,
    change,
    percentChange: (change / startPopulation) * 100,
  }
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
  'B03002_001E',
  'B03002_003E',
  'B03002_004E',
  'B03002_005E',
  'B03002_006E',
  'B03002_007E',
  'B03002_008E',
  'B03002_009E',
  'B03002_012E',
].join(',')

function estimate(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function calculateCurrentPopulationEstimate(
  population2023: number,
  population2024: number,
  population2025: number,
  targetYear = new Date().getFullYear(),
) {
  if (population2025 <= 0 || targetYear <= 2025) {
    return Math.round(population2025)
  }

  return calculatePopulationRegression(
    [
      { year: 2023, population: population2023 },
      { year: 2024, population: population2024 },
      { year: 2025, population: population2025 },
    ],
    targetYear,
  )
}

export function calculatePopulationRegression(
  observations: { year: number; population: number }[],
  targetYear: number,
) {
  const valid = observations.filter(
    ({ year, population }) =>
      Number.isFinite(year) && Number.isFinite(population) && population > 0,
  )
  if (valid.length === 0) return 0
  if (valid.length === 1) return Math.round(valid[0].population)

  const meanYear =
    valid.reduce((sum, item) => sum + item.year, 0) / valid.length
  const meanPopulation =
    valid.reduce((sum, item) => sum + item.population, 0) / valid.length
  const yearVariance = valid.reduce(
    (sum, item) => sum + (item.year - meanYear) ** 2,
    0,
  )
  if (yearVariance === 0) return Math.round(meanPopulation)

  const covariance = valid.reduce(
    (sum, item) =>
      sum + (item.year - meanYear) * (item.population - meanPopulation),
    0,
  )
  const annualTrend = covariance / yearVariance
  return Math.max(
    0,
    Math.round(meanPopulation + annualTrend * (targetYear - meanYear)),
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

  const comparisonVariables = [
    'NAME',
    'B15003_001E',
    'B15003_022E',
    'B15003_023E',
    'B15003_024E',
    'B15003_025E',
    'B25010_001E',
  ].join(',')
  const [stateComparisonResponse, nationalComparisonResponse] =
    await Promise.all([
      fetch(
        `https://api.census.gov/data/2024/acs/acs5?get=${comparisonVariables}&for=state:${state[1]}${key}`,
        { signal },
      ),
      fetch(
        `https://api.census.gov/data/2024/acs/acs5?get=${comparisonVariables}&for=us:*${key}`,
        { signal },
      ),
    ])
  const comparisonFromRow = (
    geography: string,
    row: CensusRow,
    comparisonHeaders: CensusRow,
  ) => {
    const comparisonValue = (variable: string) =>
      estimate(row[comparisonHeaders.indexOf(variable)] ?? '0')
    const adults = comparisonValue('B15003_001E')
    const bachelors = comparisonValue('B15003_022E')
    const graduate =
      comparisonValue('B15003_023E') +
      comparisonValue('B15003_024E') +
      comparisonValue('B15003_025E')
    return {
      geography,
      bachelorsPercent: adults > 0 ? (bachelors / adults) * 100 : 0,
      graduatePercent: adults > 0 ? (graduate / adults) * 100 : 0,
      bachelorsOrHigherPercent:
        adults > 0 ? ((bachelors + graduate) / adults) * 100 : 0,
      averageHouseholdSize: comparisonValue('B25010_001E'),
    }
  }
  const comparisonRows: {
    geography: string
    row: CensusRow
    headers: CensusRow
  }[] = []
  if (stateComparisonResponse.ok) {
    const stateRows = (await stateComparisonResponse.json()) as CensusRow[]
    if (stateRows[1])
      comparisonRows.push({
        geography: city.state,
        row: stateRows[1],
        headers: stateRows[0],
      })
  }
  if (nationalComparisonResponse.ok) {
    const nationalRows =
      (await nationalComparisonResponse.json()) as CensusRow[]
    if (nationalRows[1])
      comparisonRows.push({
        geography: 'United States',
        row: nationalRows[1],
        headers: nationalRows[0],
      })
  }

  const previousResponse = await fetch(
    `https://api.census.gov/data/2019/pep/population?get=POP&for=place:${placeCode}&in=state:${state[1]}&DATE_CODE=12${key}`,
    { signal },
  )
  const previousRows = previousResponse.ok
    ? ((await previousResponse.json()) as CensusRow[])
    : []
  const currentPopulation = estimate(value('B01003_001E'))
  const official2019Population = estimate(previousRows[1]?.[0] ?? '0')
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
  const population2023 = placeEstimate?.population2023 ?? currentPopulation
  const population2024 = placeEstimate?.population2024 ?? currentPopulation
  const population2025 = placeEstimate?.population2025 ?? currentPopulation
  const previousPopulation =
    official2019Population > 0 ? official2019Population : currentPopulation
  const estimateYear = new Date().getFullYear()
  const estimatedCurrentPopulation = calculateCurrentPopulationEstimate(
    population2023,
    population2024,
    population2025,
    estimateYear,
  )
  const populationObservations = [
    { year: 2023, population: population2023 },
    { year: 2024, population: population2024 },
    { year: 2025, population: population2025 },
  ]
  const firstSeriesYear = estimateYear - 4
  const populationByYear = new Map<number, number>([
    [2023, population2023],
    [2024, population2024],
    [2025, population2025],
  ])
  const populationSeries = Array.from({ length: 5 }, (_, index) => {
    const year = firstSeriesYear + index
    const officialPopulation = populationByYear.get(year)
    return {
      year,
      population:
        officialPopulation ??
        calculatePopulationRegression(populationObservations, year),
      calculated: officialPopulation === undefined,
    }
  })

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
  const bachelors = estimate(value('B15003_022E'))
  const graduate =
    estimate(value('B15003_023E')) +
    estimate(value('B15003_024E')) +
    estimate(value('B15003_025E'))
  const educationHouseholdComparison = [
    {
      geography: city.name,
      bachelorsPercent:
        adults25AndOlder > 0 ? (bachelors / adults25AndOlder) * 100 : 0,
      graduatePercent:
        adults25AndOlder > 0 ? (graduate / adults25AndOlder) * 100 : 0,
      bachelorsOrHigherPercent:
        adults25AndOlder > 0
          ? ((bachelors + graduate) / adults25AndOlder) * 100
          : 0,
      averageHouseholdSize: estimate(value('B25010_001E')),
    },
    ...comparisonRows.map(({ geography, row, headers }) =>
      comparisonFromRow(geography, row, headers),
    ),
  ]
  const raceTotal = estimate(value('B03002_001E'))
  const raceCounts = [
    {
      label: 'White, non-Hispanic',
      population: estimate(value('B03002_003E')),
    },
    { label: 'Hispanic or Latino', population: estimate(value('B03002_012E')) },
    {
      label: 'Black, non-Hispanic',
      population: estimate(value('B03002_004E')),
    },
    {
      label: 'Asian, non-Hispanic',
      population: estimate(value('B03002_006E')),
    },
    {
      label: 'Multiracial, non-Hispanic',
      population: estimate(value('B03002_009E')),
    },
    {
      label: 'Other, non-Hispanic',
      population:
        estimate(value('B03002_005E')) +
        estimate(value('B03002_007E')) +
        estimate(value('B03002_008E')),
    },
  ]
  const raceDistribution = raceCounts
    .filter(({ population }) => population > 0)
    .map((item) => ({
      ...item,
      percent: raceTotal > 0 ? (item.population / raceTotal) * 100 : 0,
    }))

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
      population2023 > 0 && population2024 > 0
        ? (((population2024 - population2023) / population2023 +
            (population2025 - population2024) / population2024) /
            2) *
          100
        : 0,
    estimateYear,
    currentPopulationNote: placeEstimate
      ? `${estimateYear} calculated from a linear trend fitted to official Census 2023–2025 estimates`
      : '2024 ACS estimate; 2025 city estimate unavailable',
    averageHouseholdSize: estimate(value('B25010_001E')),
    foreignBornPercent:
      nativityPopulation > 0 ? (foreignBorn / nativityPopulation) * 100 : 0,
    sourceName: place[0],
    populationSeries,
    raceDistribution,
    educationHouseholdComparison,
  } satisfies DemographicsData
}
