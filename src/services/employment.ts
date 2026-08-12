import type { City } from '../data/cities'

type CensusRow = string[]

export type EmploymentData = {
  employmentRate: number
  laborForce: number
  medianWorkerEarnings: number
  industries: { name: string; percent: number }[]
  sourceName: string
}

const industryVariables = [
  ['Agriculture & mining', 'DP03_0033PE'],
  ['Construction', 'DP03_0034PE'],
  ['Manufacturing', 'DP03_0035PE'],
  ['Wholesale trade', 'DP03_0036PE'],
  ['Retail trade', 'DP03_0037PE'],
  ['Transportation & utilities', 'DP03_0038PE'],
  ['Information', 'DP03_0039PE'],
  ['Finance & real estate', 'DP03_0040PE'],
  ['Technology & professional services', 'DP03_0041PE'],
  ['Education, health care & social assistance', 'DP03_0042PE'],
  ['Arts, hospitality & food', 'DP03_0043PE'],
  ['Other services', 'DP03_0044PE'],
  ['Public administration', 'DP03_0045PE'],
] as const

const variables = [
  'NAME',
  'DP03_0003E',
  'DP03_0004E',
  'DP03_0092E',
  ...industryVariables.map(([, variable]) => variable),
].join(',')

function estimate(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export async function fetchEmploymentData(city: City, signal: AbortSignal) {
  if (city.country !== 'United States') {
    throw new Error('Census employment data is available for U.S. cities only.')
  }
  const apiKey = import.meta.env.VITE_CENSUS_API_KEY
  if (!apiKey) throw new Error('Census API key is not configured.')
  const key = `&key=${encodeURIComponent(apiKey)}`
  const statesResponse = await fetch(
    `https://api.census.gov/data/2024/acs/acs5/profile?get=NAME&for=state:*${key}`,
    { signal },
  )
  if (!statesResponse.ok) throw new Error('Unable to identify Census state.')
  const states = (await statesResponse.json()) as CensusRow[]
  const state = states.slice(1).find(([name]) => name === city.state)
  if (!state) throw new Error('No Census state matched this location.')

  const placesResponse = await fetch(
    `https://api.census.gov/data/2024/acs/acs5/profile?get=${variables}&for=place:*&in=state:${state[1]}${key}`,
    { signal },
  )
  if (!placesResponse.ok)
    throw new Error('Unable to load Census employment data.')
  const rows = (await placesResponse.json()) as CensusRow[]
  const headers = rows[0]
  const place = rows
    .slice(1)
    .find(([name]) =>
      name.toLowerCase().startsWith(`${city.name.toLowerCase()} `),
    )
  if (!place) throw new Error('No Census place matched this city.')
  const value = (variable: string) => place[headers.indexOf(variable)]
  const placeCode = place[headers.indexOf('place')]
  const laborForce = estimate(value('DP03_0003E'))
  const employed = estimate(value('DP03_0004E'))

  let separateIndustries: { name: string; percent: number }[] = []
  try {
    const detailedIndustryResponse = await fetch(
      `https://api.census.gov/data/2024/acs/acs5?get=NAME,B24030_001E,B24030_091E,B24030_092E,B24030_193E,B24030_194E&for=place:${placeCode}&in=state:${state[1]}${key}`,
      { signal },
    )
    if (detailedIndustryResponse.ok) {
      const detailedRows =
        (await detailedIndustryResponse.json()) as CensusRow[]
      const detailedHeaders = detailedRows[0]
      const detailedPlace = detailedRows[1]
      const detailedValue = (variable: string) =>
        estimate(detailedPlace?.[detailedHeaders.indexOf(variable)])
      const detailedEmployed = detailedValue('B24030_001E')
      const educationWorkers =
        detailedValue('B24030_091E') + detailedValue('B24030_193E')
      const healthCareWorkers =
        detailedValue('B24030_092E') + detailedValue('B24030_194E')

      if (detailedEmployed > 0) {
        separateIndustries = [
          {
            name: 'Educational services',
            percent: (educationWorkers / detailedEmployed) * 100,
          },
          {
            name: 'Health care & social assistance',
            percent: (healthCareWorkers / detailedEmployed) * 100,
          },
        ]
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
  }

  const profileIndustries = industryVariables
    .filter(
      ([name]) =>
        separateIndustries.length === 0 ||
        name !== 'Education, health care & social assistance',
    )
    .map(([name, variable]) => ({
      name,
      percent: estimate(value(variable)),
    }))

  return {
    employmentRate: laborForce > 0 ? (employed / laborForce) * 100 : 0,
    laborForce,
    medianWorkerEarnings: estimate(value('DP03_0092E')),
    industries: [...profileIndustries, ...separateIndustries].sort(
      (a, b) => b.percent - a.percent,
    ),
    sourceName: place[0],
  } satisfies EmploymentData
}
