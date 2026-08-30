import type { City } from 'data/cities'

type CensusRow = string[]

export type EmploymentData = {
  employmentRate: number
  laborForce: number
  medianWorkerEarnings: number
  industries: {
    name: string
    percent: number
    breakdown?: { name: string; percent: number }[]
  }[]
  annualGrowth: {
    year: number
    employed: number
    changePercent: number | null
  }[]
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

const estimate = (value: string | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export const fetchEmploymentData = async (city: City, signal: AbortSignal) => {
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

  let separateIndustries: EmploymentData['industries'] = []
  try {
    const detailedIndustryResponse = await fetch(
      `https://api.census.gov/data/2024/acs/acs5?get=NAME,C24030_001E,C24030_013E,C24030_018E,C24030_019E,C24030_020E,C24030_022E,C24030_023E,C24030_040E,C24030_045E,C24030_046E,C24030_047E,C24030_049E,C24030_050E&for=place:${placeCode}&in=state:${state[1]}${key}`,
      { signal },
    )
    if (detailedIndustryResponse.ok) {
      const detailedRows =
        (await detailedIndustryResponse.json()) as CensusRow[]
      const detailedHeaders = detailedRows[0]
      const detailedPlace = detailedRows[1]
      const detailedValue = (variable: string) =>
        estimate(detailedPlace?.[detailedHeaders.indexOf(variable)])
      const detailedEmployed = detailedValue('C24030_001E')
      const informationWorkers =
        detailedValue('C24030_013E') + detailedValue('C24030_040E')
      const professionalWorkers =
        detailedValue('C24030_018E') + detailedValue('C24030_045E')
      const managementAdministrativeWorkers =
        detailedValue('C24030_019E') +
        detailedValue('C24030_020E') +
        detailedValue('C24030_046E') +
        detailedValue('C24030_047E')
      const educationWorkers =
        detailedValue('C24030_022E') + detailedValue('C24030_049E')
      const healthCareWorkers =
        detailedValue('C24030_023E') + detailedValue('C24030_050E')

      if (detailedEmployed > 0) {
        const informationPercent = (informationWorkers / detailedEmployed) * 100
        const professionalServicesPercent =
          (professionalWorkers / detailedEmployed) * 100
        let detailedProfessionalIndustries:
          { name: string; percent: number }[] | undefined
        try {
          const professionalVariables = [
            ['Legal services', 'B24134_185E'],
            ['Accounting & payroll', 'B24134_186E'],
            ['Architecture & engineering', 'B24134_187E'],
            ['Specialized design', 'B24134_188E'],
            ['Computer systems design', 'B24134_189E'],
            ['Management & technical consulting', 'B24134_190E'],
            ['Scientific research & development', 'B24134_191E'],
            ['Advertising & public relations', 'B24134_192E'],
            ['Veterinary services', 'B24134_193E'],
            ['Other professional & technical services', 'B24134_194E'],
          ] as const
          const professionalResponse = await fetch(
            `https://api.census.gov/data/2024/acs/acs5?get=NAME,${professionalVariables.map(([, variable]) => variable).join(',')}&for=place:${placeCode}&in=state:${state[1]}${key}`,
            { signal },
          )
          if (professionalResponse.ok) {
            const professionalRows =
              (await professionalResponse.json()) as CensusRow[]
            const professionalHeaders = professionalRows[0]
            const professionalPlace = professionalRows[1]
            const detailedIndustries = professionalVariables
              .map(([name, variable]) => ({
                name,
                percent:
                  (estimate(
                    professionalPlace?.[professionalHeaders.indexOf(variable)],
                  ) /
                    detailedEmployed) *
                  100,
              }))
              .filter(({ percent }) => percent > 0)
              .sort((a, b) => b.percent - a.percent)
            detailedProfessionalIndustries =
              detailedIndustries.length > 0 ? detailedIndustries : undefined
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError')
            throw error
        }

        const professionalBreakdown =
          detailedProfessionalIndustries ??
          [
            {
              name: 'Professional, scientific & technical services',
              percent: professionalServicesPercent,
            },
          ]
            .filter(({ percent }) => percent > 0)
            .sort((a, b) => b.percent - a.percent)
        separateIndustries = [
          {
            name: 'Information',
            percent: informationPercent,
          },
          {
            name: 'Professional services',
            percent: professionalServicesPercent,
            breakdown: professionalBreakdown,
          },
          {
            name: 'Management & administrative services',
            percent: (managementAdministrativeWorkers / detailedEmployed) * 100,
          },
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
        ![
          'Information',
          'Technology & professional services',
          'Education, health care & social assistance',
        ].includes(name),
    )
    .map(([name, variable]) => ({
      name,
      percent: estimate(value(variable)),
    }))

  const annualGrowth = (
    await Promise.all(
      [2019, 2020, 2021, 2022, 2023, 2024].map(async (year) => {
        try {
          const response = await fetch(
            `https://api.census.gov/data/${year}/acs/acs5/profile?get=DP03_0004E&for=place:${placeCode}&in=state:${state[1]}${key}`,
            { signal },
          )
          if (!response.ok) return null
          const annualRows = (await response.json()) as CensusRow[]
          const employedPopulation = estimate(annualRows[1]?.[0])
          return employedPopulation > 0
            ? { year, employed: employedPopulation }
            : null
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError')
            throw error
          return null
        }
      }),
    )
  ).filter((item): item is { year: number; employed: number } => item !== null)

  return {
    employmentRate: laborForce > 0 ? (employed / laborForce) * 100 : 0,
    laborForce,
    medianWorkerEarnings: estimate(value('DP03_0092E')),
    industries: [...profileIndustries, ...separateIndustries].sort(
      (a, b) => b.percent - a.percent,
    ),
    annualGrowth: annualGrowth.map((item, index) => ({
      ...item,
      changePercent:
        index === 0
          ? null
          : ((item.employed - annualGrowth[index - 1].employed) /
              annualGrowth[index - 1].employed) *
            100,
    })),
    sourceName: place[0],
  } satisfies EmploymentData
}
