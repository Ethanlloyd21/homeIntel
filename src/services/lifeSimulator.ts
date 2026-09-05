export type HousingMode = 'rent' | 'buy'

export type LifeInputs = {
  annualIncome: number
  householdSize: number
  housingMode: HousingMode
  effectiveTaxRate: number
  downPaymentPercent: number
  mortgageRate: number
  commuteMiles: number
  commuteDaysPerWeek: number
  vehicleMpg: number
  gasPrice: number
  childcareMonthly: number
  healthcareMonthly: number
  debtMonthly: number
  otherMonthly: number
  desiredIndustry: string
}

export type DealBreakers = {
  maximumHousing: number
  minimumDisposable: number
  maximumRisk: number
  minimumEmploymentRate: number
  requireIndustryMatch: boolean
}

export type PreferenceWeights = {
  affordability: number
  career: number
  safety: number
  community: number
}

export type CityLifeData = {
  name: string
  medianRent: number
  medianHomeValue: number
  costOfLivingIndex: number
  employmentRate: number
  medianWorkerEarnings: number
  collegeEducatedPercent: number
  riskScore: number
  industries: { name: string; percent: number }[]
}

export type CostLine = {
  key: string
  label: string
  value: number
  explanation: string
}

export type RequirementResult = {
  label: string
  passed: boolean
  actual: string
  rule: string
}

export type LifeSimulation = {
  grossMonthlyIncome: number
  totalMonthlyCosts: number
  disposableIncome: number
  housingExposure: number
  housingBurdenPercent: number
  costs: CostLine[]
  requirements: RequirementResult[]
  dimensions: Record<keyof PreferenceWeights, number>
  fitScore: number
  regretScore: number
  industryMatch: { matched: boolean; label: string; percent: number }
  explanations: string[]
}

export const defaultLifeInputs: LifeInputs = {
  annualIncome: 90_000,
  householdSize: 2,
  housingMode: 'rent',
  effectiveTaxRate: 22,
  downPaymentPercent: 20,
  mortgageRate: 6.5,
  commuteMiles: 12,
  commuteDaysPerWeek: 3,
  vehicleMpg: 28,
  gasPrice: 3.4,
  childcareMonthly: 0,
  healthcareMonthly: 450,
  debtMonthly: 300,
  otherMonthly: 350,
  desiredIndustry: '',
}

export const defaultDealBreakers: DealBreakers = {
  maximumHousing: 2_500,
  minimumDisposable: 1_000,
  maximumRisk: 65,
  minimumEmploymentRate: 92,
  requireIndustryMatch: false,
}

export const defaultPreferenceWeights: PreferenceWeights = {
  affordability: 5,
  career: 4,
  safety: 3,
  community: 2,
}

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : 0))

const safe = (value: number, fallback = 0) =>
  Number.isFinite(value) && value >= 0 ? value : fallback

export const monthlyMortgagePayment = (
  homeValue: number,
  downPaymentPercent: number,
  annualRate: number,
  years = 30,
) => {
  const principal = safe(homeValue) * (1 - clamp(downPaymentPercent) / 100)
  const payments = years * 12
  const monthlyRate = safe(annualRate) / 100 / 12
  if (principal === 0) return 0
  if (monthlyRate === 0) return principal / payments
  return (
    (principal * monthlyRate * (1 + monthlyRate) ** payments) /
    ((1 + monthlyRate) ** payments - 1)
  )
}

const findIndustry = (
  industries: CityLifeData['industries'],
  desired: string,
) => {
  const search = desired.trim().toLowerCase()
  if (!search) return null
  return (
    industries.find((industry) =>
      industry.name.toLowerCase().includes(search),
    ) ?? null
  )
}

const weightedScore = (
  dimensions: LifeSimulation['dimensions'],
  weights: PreferenceWeights,
) => {
  const keys = Object.keys(weights) as (keyof PreferenceWeights)[]
  const totalWeight = keys.reduce((sum, key) => sum + safe(weights[key]), 0)
  if (totalWeight === 0) return 0
  return (
    keys.reduce((sum, key) => sum + dimensions[key] * safe(weights[key]), 0) /
    totalWeight
  )
}

export const calculateLifeSimulation = (
  city: CityLifeData,
  inputs: LifeInputs,
  dealBreakers: DealBreakers,
  weights: PreferenceWeights,
): LifeSimulation => {
  const costIndex = safe(city.costOfLivingIndex, 100) || 100
  const costFactor = costIndex / 100
  const householdSize = Math.max(1, Math.round(safe(inputs.householdSize, 1)))
  const grossMonthlyIncome = safe(inputs.annualIncome) / 12
  const taxes = grossMonthlyIncome * (clamp(inputs.effectiveTaxRate) / 100)
  const mortgagePrincipalAndInterest = monthlyMortgagePayment(
    city.medianHomeValue,
    inputs.downPaymentPercent,
    inputs.mortgageRate,
  )
  const propertyTaxAndInsurance =
    inputs.housingMode === 'buy' ? (safe(city.medianHomeValue) * 0.018) / 12 : 0
  const housing =
    inputs.housingMode === 'buy'
      ? mortgagePrincipalAndInterest + propertyTaxAndInsurance
      : safe(city.medianRent)
  const utilities = 210 * costFactor * (0.72 + householdSize * 0.28)
  const groceries = (390 + Math.max(0, householdSize - 1) * 245) * costFactor
  const commuteMilesMonthly =
    safe(inputs.commuteMiles) * 2 * safe(inputs.commuteDaysPerWeek) * 4.33
  const fuel =
    (commuteMilesMonthly / Math.max(1, safe(inputs.vehicleMpg, 1))) *
    safe(inputs.gasPrice)
  const transportation = 260 * costFactor + fuel
  const hazardReserve = housing * (clamp(city.riskScore) / 100) * 0.035

  const costs: CostLine[] = [
    {
      key: 'taxes',
      label: 'Estimated taxes',
      value: taxes,
      explanation: `${inputs.effectiveTaxRate.toFixed(1)}% user-selected effective rate`,
    },
    {
      key: 'housing',
      label:
        inputs.housingMode === 'buy' ? 'Mortgage, tax & insurance' : 'Rent',
      value: housing,
      explanation:
        inputs.housingMode === 'buy'
          ? `${inputs.downPaymentPercent}% down, ${inputs.mortgageRate.toFixed(2)}% rate, 30-year loan; property tax and insurance planning allowance included`
          : 'Latest Zillow market rent or Census fallback',
    },
    {
      key: 'utilities',
      label: 'Utilities',
      value: utilities,
      explanation: 'Household-size estimate adjusted by the state price level',
    },
    {
      key: 'groceries',
      label: 'Groceries',
      value: groceries,
      explanation: 'Household-size estimate adjusted by the state price level',
    },
    {
      key: 'transportation',
      label: 'Transportation',
      value: transportation,
      explanation: `${Math.round(commuteMilesMonthly)} commute miles/month plus a local-cost-adjusted vehicle allowance`,
    },
    {
      key: 'healthcare',
      label: 'Healthcare',
      value: safe(inputs.healthcareMonthly),
      explanation: 'Your monthly estimate',
    },
    {
      key: 'childcare',
      label: 'Childcare',
      value: safe(inputs.childcareMonthly),
      explanation: 'Your monthly estimate',
    },
    {
      key: 'debt',
      label: 'Debt payments',
      value: safe(inputs.debtMonthly),
      explanation: 'Your monthly estimate',
    },
    {
      key: 'other',
      label: 'Other essentials',
      value: safe(inputs.otherMonthly),
      explanation: 'Your monthly estimate',
    },
    {
      key: 'hazard',
      label: 'Hazard reserve',
      value: hazardReserve,
      explanation:
        'Planning buffer equal to 3.5% of housing cost at a risk score of 100',
    },
  ]
  const totalMonthlyCosts = costs.reduce((sum, item) => sum + item.value, 0)
  const disposableIncome = grossMonthlyIncome - totalMonthlyCosts
  const housingExposure = housing + utilities + transportation + hazardReserve
  const housingBurdenPercent = grossMonthlyIncome
    ? (housingExposure / grossMonthlyIncome) * 100
    : 100
  const industry = findIndustry(city.industries, inputs.desiredIndustry)
  const industryMatch = {
    matched: inputs.desiredIndustry.trim() === '' || Boolean(industry),
    label:
      industry?.name ??
      (inputs.desiredIndustry.trim() || 'No industry selected'),
    percent: industry?.percent ?? 0,
  }

  const requirements: RequirementResult[] = [
    {
      label: 'Housing budget',
      passed: housing <= safe(dealBreakers.maximumHousing),
      actual: `$${Math.round(housing).toLocaleString()}/mo`,
      rule: `At most $${Math.round(dealBreakers.maximumHousing).toLocaleString()}/mo`,
    },
    {
      label: 'Monthly cash buffer',
      passed: disposableIncome >= safe(dealBreakers.minimumDisposable),
      actual: `$${Math.round(disposableIncome).toLocaleString()}/mo`,
      rule: `At least $${Math.round(dealBreakers.minimumDisposable).toLocaleString()}/mo`,
    },
    {
      label: 'Natural-hazard risk',
      passed: city.riskScore <= safe(dealBreakers.maximumRisk),
      actual: `${Math.round(city.riskScore)}/100`,
      rule: `At most ${Math.round(dealBreakers.maximumRisk)}/100`,
    },
    {
      label: 'Employment rate',
      passed: city.employmentRate >= safe(dealBreakers.minimumEmploymentRate),
      actual: `${city.employmentRate.toFixed(1)}%`,
      rule: `At least ${dealBreakers.minimumEmploymentRate.toFixed(1)}%`,
    },
    ...(dealBreakers.requireIndustryMatch
      ? [
          {
            label: 'Career field represented',
            passed: industryMatch.matched,
            actual: industryMatch.matched
              ? `${industryMatch.label} (${industryMatch.percent.toFixed(1)}%)`
              : 'No matching Census sector',
            rule: `Match “${inputs.desiredIndustry || 'selected industry'}”`,
          },
        ]
      : []),
  ]

  const disposableRatio = grossMonthlyIncome
    ? disposableIncome / grossMonthlyIncome
    : -1
  const dimensions = {
    affordability: clamp(
      50 + disposableRatio * 125 - Math.max(0, housingBurdenPercent - 40),
    ),
    career: clamp(
      (city.employmentRate - 80) * 4 +
        Math.min(25, industryMatch.percent * 1.5) +
        (inputs.desiredIndustry.trim() && industryMatch.matched ? 10 : 0),
    ),
    safety: clamp(100 - city.riskScore),
    community: clamp(35 + city.collegeEducatedPercent * 1.15),
  }
  const fitScore = Math.round(weightedScore(dimensions, weights))
  const failures = requirements.filter((requirement) => !requirement.passed)
  const regretScore = Math.round(
    clamp(
      100 -
        fitScore +
        failures.length * 7 +
        Math.max(0, housingBurdenPercent - 45) * 0.8 +
        (disposableIncome < 0 ? 12 : 0),
    ),
  )

  return {
    grossMonthlyIncome,
    totalMonthlyCosts,
    disposableIncome,
    housingExposure,
    housingBurdenPercent,
    costs,
    requirements,
    dimensions,
    fitScore,
    regretScore,
    industryMatch,
    explanations: [
      `${requirements.filter((item) => item.passed).length} of ${requirements.length} deal-breakers pass.`,
      `Housing exposure uses housing, utilities, transportation, and a transparent hazard reserve.`,
      `Regret risk starts with the inverse fit score, adds 7 points per failed deal-breaker, and adds pressure for housing exposure above 45% or a negative cash buffer.`,
      industryMatch.matched
        ? `${industryMatch.label} is represented in the Census employment profile.`
        : `The selected career field was not found in the available Census sectors.`,
    ],
  }
}

export const calculateConsensusScore = (
  dimensions: LifeSimulation['dimensions'],
  first: PreferenceWeights,
  second: PreferenceWeights,
) => {
  const firstScore = Math.round(weightedScore(dimensions, first))
  const secondScore = Math.round(weightedScore(dimensions, second))
  return {
    firstScore,
    secondScore,
    combinedScore: Math.round((firstScore + secondScore) / 2),
    alignment: Math.max(0, 100 - Math.abs(firstScore - secondScore) * 2),
  }
}
