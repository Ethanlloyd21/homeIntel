import type { City } from 'data/cities'

export type CurrentEconomyData = {
  county?: string
  laus: null | {
    employment: number
    unemployment: number
    unemploymentRate: number
    laborForce: number
    period: string
    geography: string
    annualEmployment: {
      year: number
      employed: number
      monthsReported: number
      changePercent: number | null
    }[]
  }
  qcew: null | {
    period: string
    geography: string
    employment: number
    averageWeeklyWage: number
    employmentGrowthPercent: number
  }
  qwi: null | {
    period: string
    geography: string
    employment: number
    hires: number
    separations: number
    averageMonthlyEarnings: number
  }
  bea: null | {
    year: number
    geography: string
    realGdp: number
    growthPercent: number
  }
}

export const fetchCurrentEconomy = async (city: City, signal: AbortSignal) => {
  const params = new URLSearchParams({
    city: city.name,
    state: city.state,
    latitude: String(city.latitude),
    longitude: String(city.longitude),
  })
  const response = await fetch(`/api/current-economy?${params}`, { signal })
  if (!response.ok) throw new Error('Unable to load current economic data.')
  return (await response.json()) as CurrentEconomyData
}
