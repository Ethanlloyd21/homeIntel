import type { City } from 'data/cities'

const stateCodes: Record<string, { abbreviation: string; fips: string }> = {
  Alabama: { abbreviation: 'AL', fips: '01000' },
  Alaska: { abbreviation: 'AK', fips: '02000' },
  Arizona: { abbreviation: 'AZ', fips: '04000' },
  Arkansas: { abbreviation: 'AR', fips: '05000' },
  California: { abbreviation: 'CA', fips: '06000' },
  Colorado: { abbreviation: 'CO', fips: '08000' },
  Connecticut: { abbreviation: 'CT', fips: '09000' },
  Delaware: { abbreviation: 'DE', fips: '10000' },
  Florida: { abbreviation: 'FL', fips: '12000' },
  Georgia: { abbreviation: 'GA', fips: '13000' },
  Hawaii: { abbreviation: 'HI', fips: '15000' },
  Idaho: { abbreviation: 'ID', fips: '16000' },
  Illinois: { abbreviation: 'IL', fips: '17000' },
  Indiana: { abbreviation: 'IN', fips: '18000' },
  Iowa: { abbreviation: 'IA', fips: '19000' },
  Kansas: { abbreviation: 'KS', fips: '20000' },
  Kentucky: { abbreviation: 'KY', fips: '21000' },
  Louisiana: { abbreviation: 'LA', fips: '22000' },
  Maine: { abbreviation: 'ME', fips: '23000' },
  Maryland: { abbreviation: 'MD', fips: '24000' },
  Massachusetts: { abbreviation: 'MA', fips: '25000' },
  Michigan: { abbreviation: 'MI', fips: '26000' },
  Minnesota: { abbreviation: 'MN', fips: '27000' },
  Mississippi: { abbreviation: 'MS', fips: '28000' },
  Missouri: { abbreviation: 'MO', fips: '29000' },
  Montana: { abbreviation: 'MT', fips: '30000' },
  Nebraska: { abbreviation: 'NE', fips: '31000' },
  Nevada: { abbreviation: 'NV', fips: '32000' },
  'New Hampshire': { abbreviation: 'NH', fips: '33000' },
  'New Jersey': { abbreviation: 'NJ', fips: '34000' },
  'New Mexico': { abbreviation: 'NM', fips: '35000' },
  'New York': { abbreviation: 'NY', fips: '36000' },
  'North Carolina': { abbreviation: 'NC', fips: '37000' },
  'North Dakota': { abbreviation: 'ND', fips: '38000' },
  Ohio: { abbreviation: 'OH', fips: '39000' },
  Oklahoma: { abbreviation: 'OK', fips: '40000' },
  Oregon: { abbreviation: 'OR', fips: '41000' },
  Pennsylvania: { abbreviation: 'PA', fips: '42000' },
  'Rhode Island': { abbreviation: 'RI', fips: '44000' },
  'South Carolina': { abbreviation: 'SC', fips: '45000' },
  'South Dakota': { abbreviation: 'SD', fips: '46000' },
  Tennessee: { abbreviation: 'TN', fips: '47000' },
  Texas: { abbreviation: 'TX', fips: '48000' },
  Utah: { abbreviation: 'UT', fips: '49000' },
  Vermont: { abbreviation: 'VT', fips: '50000' },
  Virginia: { abbreviation: 'VA', fips: '51000' },
  Washington: { abbreviation: 'WA', fips: '53000' },
  'West Virginia': { abbreviation: 'WV', fips: '54000' },
  Wisconsin: { abbreviation: 'WI', fips: '55000' },
  Wyoming: { abbreviation: 'WY', fips: '56000' },
}

const regionalPriceParity2024: Record<string, number> = {
  Alabama: 88.823,
  Alaska: 102.359,
  Arizona: 100.677,
  Arkansas: 86.937,
  California: 110.72,
  Colorado: 103.052,
  Connecticut: 103.61,
  Delaware: 99.808,
  Florida: 103.414,
  Georgia: 96.293,
  Hawaii: 109.951,
  Idaho: 95.494,
  Illinois: 99.958,
  Indiana: 93.329,
  Iowa: 87.762,
  Kansas: 90.068,
  Kentucky: 90.159,
  Louisiana: 88.207,
  Maine: 97.05,
  Maryland: 104.959,
  Massachusetts: 105.757,
  Michigan: 96.217,
  Minnesota: 98.621,
  Mississippi: 86.953,
  Missouri: 90.817,
  Montana: 94.645,
  Nebraska: 90.103,
  Nevada: 99.979,
  'New Hampshire': 104.165,
  'New Jersey': 108.805,
  'New Mexico': 92.212,
  'New York': 107.921,
  'North Carolina': 94.326,
  'North Dakota': 88.959,
  Ohio: 92.774,
  Oklahoma: 87.843,
  Oregon: 103.361,
  Pennsylvania: 97.572,
  'Rhode Island': 102.28,
  'South Carolina': 93.749,
  'South Dakota': 88.586,
  Tennessee: 91.87,
  Texas: 97.057,
  Utah: 98.864,
  Vermont: 97.958,
  Virginia: 101.104,
  Washington: 107.013,
  'West Virginia': 89.497,
  Wisconsin: 94.095,
  Wyoming: 92.691,
}

export type ComparisonIndices = {
  costOfLivingIndex: number | null
  violentCrimeIndex: number | null
  costGeography: string
  crimeGeography: string
}

type CrimeResponse = {
  offenses?: { rates?: Record<string, Record<string, number>> }
}

const average = (values: Record<string, number> | undefined) => {
  const numbers = Object.values(values ?? {}).filter(Number.isFinite)
  return numbers.length
    ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
    : null
}

export const fetchComparisonIndices = async (
  city: City,
  signal: AbortSignal,
): Promise<ComparisonIndices> => {
  const code = stateCodes[city.state]
  if (!code || city.country !== 'United States')
    return {
      costOfLivingIndex: null,
      violentCrimeIndex: null,
      costGeography: '',
      crimeGeography: '',
    }

  const crimeUrl = `/api/fbi-crime?state=${encodeURIComponent(code.abbreviation)}`

  const crimeResult = (await fetch(crimeUrl, { signal })
    .then((response) => (response.ok ? response.json() : Promise.reject()))
    .catch(() => null)) as CrimeResponse | null
  const rates = crimeResult?.offenses?.rates
  const stateRate = average(rates?.[`${city.state} Offenses`])
  const nationalRate = average(rates?.['United States Offenses'])

  return {
    costOfLivingIndex: regionalPriceParity2024[city.state] ?? null,
    violentCrimeIndex:
      stateRate && nationalRate ? (stateRate / nationalRate) * 100 : null,
    costGeography: `${city.state} price level`,
    crimeGeography: `${city.state} 2023 reported violent-crime rate`,
  }
}
