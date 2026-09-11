import type { ClimateProfile } from 'services/climate'
import type {
  CityLifeData,
  LifeInputs,
  LifeSimulation,
} from 'services/lifeSimulator'

export type RegretFactorKey =
  | 'housingShock'
  | 'cashBuffer'
  | 'salaryAdjustment'
  | 'commuteShock'
  | 'climateMismatch'
  | 'hazardExposure'
  | 'jobConcentration'
  | 'healthcareAccess'
  | 'personalSafety'
  | 'supportDistance'

export type RegretLevel = 'low' | 'moderate' | 'elevated' | 'high'

export type RegretFactor = {
  key: RegretFactorKey
  label: string
  /** 0 = no regret pressure, 100 = maximum regret pressure. */
  risk: number
  weight: number
  level: RegretLevel
  headline: string
  evidence: string[]
  /** Whether the factor was measured, estimated, or could not be assessed. */
  basis: 'measured' | 'estimated' | 'unavailable'
}

export type RegretAssessment = {
  score: number
  level: RegretLevel
  factors: RegretFactor[]
  assessed: RegretFactor[]
  topRisks: RegretFactor[]
  strengths: RegretFactor[]
  unavailable: RegretFactor[]
  summary: string
  coverage: number
}

export type RegretContext = {
  destination: CityLifeData
  destinationSimulation: LifeSimulation
  origin: CityLifeData | null
  originSimulation: LifeSimulation | null
  destinationClimate: ClimateProfile | null
  originClimate: ClimateProfile | null
  inputs: LifeInputs
  /** Great-circle miles between the origin city and the destination city. */
  supportNetworkMiles: number | null
  originCommuteMinutes: number | null
}

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : 0))

const levelOf = (risk: number): RegretLevel => {
  if (risk >= 70) return 'high'
  if (risk >= 45) return 'elevated'
  if (risk >= 22) return 'moderate'
  return 'low'
}

export const regretLevelLabel: Record<RegretLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
}

const percentChange = (from: number, to: number) =>
  from > 0 ? ((to - from) / from) * 100 : null

const signed = (value: number, digits = 0) =>
  `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`

const unavailable = (
  key: RegretFactorKey,
  label: string,
  weight: number,
  reason: string,
): RegretFactor => ({
  key,
  label,
  risk: 0,
  weight,
  level: 'low',
  headline: 'Not assessed',
  evidence: [reason],
  basis: 'unavailable',
})

/** Herfindahl index of a perfectly even split across the 13 Census sectors. */
const EVEN_SECTOR_HHI = 900
/** Roughly where a single-industry local economy sits. */
const CONCENTRATED_HHI = 2_400

/**
 * Herfindahl concentration of the local employment mix, rescaled to 0-100.
 * The Census sector list is fixed, so the raw index is compared against a
 * fixed band rather than normalised by sector count — that keeps the score
 * comparable between cities and keeps real differences visible, where a
 * count-normalised index would compress every US city into single digits.
 */
export const employmentConcentration = (
  industries: { name: string; percent: number }[],
) => {
  const shares = industries
    .map((industry) => industry.percent)
    .filter((percent) => Number.isFinite(percent) && percent > 0)
  if (shares.length < 2) return null
  const total = shares.reduce((sum, share) => sum + share, 0)
  if (total <= 0) return null
  const hhi = shares.reduce(
    (sum, share) => sum + ((share / total) * 100) ** 2,
    0,
  )
  return clamp(
    ((hhi - EVEN_SECTOR_HHI) / (CONCENTRATED_HHI - EVEN_SECTOR_HHI)) * 100,
  )
}

const housingShockFactor = (context: RegretContext): RegretFactor => {
  const { destinationSimulation, originSimulation } = context
  const weight = 5
  const burden = destinationSimulation.housingBurdenPercent
  // 28% of gross is comfortable, 50% is severe cost burden.
  const burdenRisk = clamp(((burden - 28) / 22) * 100)
  const evidence = [
    `Total housing exposure is ${Math.round(destinationSimulation.housingExposure).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/mo, or ${burden.toFixed(1)}% of gross income.`,
    'Exposure combines housing, utilities, transportation, and the hazard reserve — not rent alone.',
  ]

  if (!originSimulation) {
    return {
      key: 'housingShock',
      label: 'Housing-cost shock',
      risk: burdenRisk,
      weight,
      level: levelOf(burdenRisk),
      headline:
        burdenRisk >= 45
          ? 'Housing would absorb an uncomfortable share of income'
          : 'Housing fits inside a conventional budget share',
      evidence: [
        ...evidence,
        'Add the city you live in now to compare this against your current housing cost.',
      ],
      basis: 'estimated',
    }
  }

  const change = percentChange(
    originSimulation.housingExposure,
    destinationSimulation.housingExposure,
  )
  const changeRisk = change === null ? burdenRisk : clamp((change / 40) * 100)
  const risk = clamp(burdenRisk * 0.5 + changeRisk * 0.5)
  return {
    key: 'housingShock',
    label: 'Housing-cost shock',
    risk,
    weight,
    level: levelOf(risk),
    headline:
      change === null
        ? 'Housing exposure could not be compared'
        : change > 0
          ? `Housing exposure rises ${change.toFixed(0)}% versus ${context.origin?.name}`
          : `Housing exposure falls ${Math.abs(change).toFixed(0)}% versus ${context.origin?.name}`,
    evidence: [
      ...evidence,
      change === null
        ? 'No comparable origin housing cost was available.'
        : `${context.origin?.name}: $${Math.round(originSimulation.housingExposure).toLocaleString()}/mo → ${context.destination.name}: $${Math.round(destinationSimulation.housingExposure).toLocaleString()}/mo.`,
    ],
    basis: 'measured',
  }
}

const cashBufferFactor = (context: RegretContext): RegretFactor => {
  const { destinationSimulation } = context
  const weight = 5
  const disposable = destinationSimulation.disposableIncome
  const ratio = destinationSimulation.grossMonthlyIncome
    ? disposable / destinationSimulation.grossMonthlyIncome
    : 0
  // 20% of gross left over is healthy; nothing left over is critical.
  const risk = clamp((1 - ratio / 0.2) * 100)
  const failures = destinationSimulation.requirements.filter(
    (requirement) => !requirement.passed,
  )
  return {
    key: 'cashBuffer',
    label: 'Monthly cash buffer',
    risk: clamp(risk + failures.length * 4),
    weight,
    level: levelOf(clamp(risk + failures.length * 4)),
    headline:
      disposable < 0
        ? 'Modeled costs exceed income at these assumptions'
        : `About $${Math.round(disposable).toLocaleString()} left each month`,
    evidence: [
      `${(ratio * 100).toFixed(1)}% of gross income remains after every modeled cost.`,
      failures.length
        ? `${failures.length} of your deal-breakers fail here: ${failures.map((failure) => failure.label).join(', ')}.`
        : 'Every deal-breaker you set passes in this city.',
    ],
    basis: 'measured',
  }
}

const salaryAdjustmentFactor = (context: RegretContext): RegretFactor => {
  const { inputs, destination, origin } = context
  const weight = 4
  const destinationIndex = destination.costOfLivingIndex || 100
  const originIndex = origin?.costOfLivingIndex || destinationIndex
  const currentReal = inputs.currentAnnualIncome / (originIndex / 100)
  const futureReal = inputs.annualIncome / (destinationIndex / 100)
  const change = percentChange(currentReal, futureReal)
  if (change === null)
    return unavailable(
      'salaryAdjustment',
      'Salary adjustment',
      weight,
      'Enter your current income to compare real purchasing power.',
    )
  // Losing a fifth of real purchasing power is the top of the scale.
  const risk = clamp((-change / 20) * 100)
  return {
    key: 'salaryAdjustment',
    label: 'Salary adjustment',
    risk,
    weight,
    level: levelOf(risk),
    headline:
      change >= 0
        ? `Your pay buys ${change.toFixed(0)}% more after price levels`
        : `Your pay buys ${Math.abs(change).toFixed(0)}% less after price levels`,
    evidence: [
      `$${Math.round(inputs.currentAnnualIncome).toLocaleString()} at a ${originIndex.toFixed(1)} price level → $${Math.round(inputs.annualIncome).toLocaleString()} at a ${destinationIndex.toFixed(1)} price level.`,
      `Local median worker earnings are $${Math.round(destination.medianWorkerEarnings).toLocaleString()}, so your offer sits at ${destination.medianWorkerEarnings > 0 ? `${((inputs.annualIncome / destination.medianWorkerEarnings) * 100).toFixed(0)}%` : 'an unknown share'} of the local median.`,
      'Price levels are BEA state regional price parities, not neighborhood prices.',
    ],
    basis: origin ? 'measured' : 'estimated',
  }
}

const commuteShockFactor = (context: RegretContext): RegretFactor => {
  const { destination, originCommuteMinutes } = context
  const weight = 3
  const minutes = destination.commuteMinutes
  if (typeof minutes !== 'number' || !Number.isFinite(minutes))
    return unavailable(
      'commuteShock',
      'Commute shock',
      weight,
      'Set a home point and a workplace on the Neighborhoods page to measure a real commute.',
    )
  // 20 minutes is unremarkable; 60 minutes each way is the top of the scale.
  const absoluteRisk = clamp(((minutes - 20) / 40) * 100)
  const delta =
    typeof originCommuteMinutes === 'number'
      ? minutes - originCommuteMinutes
      : null
  const deltaRisk = delta === null ? absoluteRisk : clamp((delta / 25) * 100)
  const risk = clamp(absoluteRisk * 0.6 + deltaRisk * 0.4)
  return {
    key: 'commuteShock',
    label: 'Commute shock',
    risk,
    weight,
    level: levelOf(risk),
    headline: `${Math.round(minutes)} minutes each way in current traffic`,
    evidence: [
      `That is ${Math.round((minutes * 2 * context.inputs.commuteDaysPerWeek * 4.33) / 60)} hours a month behind the wheel at ${context.inputs.commuteDaysPerWeek} office days a week.`,
      delta === null
        ? 'No comparable commute was measured for your current city.'
        : `${signed(delta)} minutes versus your current commute.`,
    ],
    basis: 'measured',
  }
}

const climateMismatchFactor = (context: RegretContext): RegretFactor => {
  const { destinationClimate, originClimate, inputs } = context
  const weight = 3
  if (!destinationClimate)
    return unavailable(
      'climateMismatch',
      'Climate mismatch',
      weight,
      'Historical weather has not loaded for this city yet.',
    )
  const comfortable = destinationClimate.comfortableDaysPerYear
  // 180 comfortable days a year is excellent; 60 is a hard climate for you.
  const absoluteRisk = clamp(((180 - comfortable) / 120) * 100)
  const delta = originClimate
    ? comfortable - originClimate.comfortableDaysPerYear
    : null
  const deltaRisk = delta === null ? absoluteRisk : clamp((-delta / 90) * 100)
  const risk = clamp(absoluteRisk * 0.55 + deltaRisk * 0.45)
  return {
    key: 'climateMismatch',
    label: 'Climate mismatch',
    risk,
    weight,
    level: levelOf(risk),
    headline: `${comfortable} days a year land in your ${inputs.comfortLowF}–${inputs.comfortHighF}°F range`,
    evidence: [
      `${destinationClimate.hotDaysPerYear} days a year reach 90°F and ${destinationClimate.freezingDaysPerYear} nights fall below freezing.`,
      delta === null
        ? `Measured across ${destinationClimate.yearsObserved} years of observed daily weather.`
        : `${signed(delta)} comfortable days a year versus ${context.origin?.name ?? 'your current city'}.`,
      `${destinationClimate.wetDaysPerYear} wet days and ${destinationClimate.snowDaysPerYear} snow days a year.`,
    ],
    basis: 'measured',
  }
}

const hazardExposureFactor = (context: RegretContext): RegretFactor => {
  const { destination, origin, destinationSimulation } = context
  const weight = 4
  const score = destination.riskScore
  const risk = clamp(score)
  const reserve = destinationSimulation.costs.find(
    (cost) => cost.key === 'hazard',
  )
  const delta = origin ? score - origin.riskScore : null
  return {
    key: 'hazardExposure',
    label: 'Hazard & insurance exposure',
    risk,
    weight,
    level: levelOf(risk),
    headline: `FEMA expected annual loss score of ${Math.round(score)} out of 100`,
    evidence: [
      `Carries a modeled hazard reserve of $${Math.round(reserve?.value ?? 0).toLocaleString()}/mo in this plan.`,
      delta === null
        ? 'Score is the FEMA National Risk Index value for the census tract at the city centroid.'
        : `${signed(delta)} points versus ${context.origin?.name}.`,
      'Insurance carriers price this differently by property. Get address-level quotes before committing.',
    ],
    basis: 'measured',
  }
}

const jobConcentrationFactor = (context: RegretContext): RegretFactor => {
  const { destination, destinationSimulation, inputs } = context
  const weight = 4
  const concentration = employmentConcentration(destination.industries)
  if (concentration === null)
    return unavailable(
      'jobConcentration',
      'Job-market concentration',
      weight,
      'The Census employment profile has not loaded for this city.',
    )
  const employmentRisk = clamp((96 - destination.employmentRate) * 12)
  const matchPenalty =
    inputs.desiredIndustry.trim() &&
    !destinationSimulation.industryMatch.matched
      ? 25
      : 0
  const risk = clamp(
    concentration * 0.45 + employmentRisk * 0.35 + matchPenalty,
  )
  const top = [...destination.industries].sort(
    (a, b) => b.percent - a.percent,
  )[0]
  return {
    key: 'jobConcentration',
    label: 'Job-market concentration',
    risk,
    weight,
    level: levelOf(risk),
    headline: top
      ? `${top.name} alone employs ${top.percent.toFixed(1)}% of local workers`
      : 'Local employment mix assessed',
    evidence: [
      `Sector concentration scores ${Math.round(concentration)}/100 across ${destination.industries.length} Census sectors — lower means a more diversified fallback if one employer fails.`,
      `Employment rate is ${destination.employmentRate.toFixed(1)}%.`,
      inputs.desiredIndustry.trim()
        ? destinationSimulation.industryMatch.matched
          ? `Your field matches ${destinationSimulation.industryMatch.label} at ${destinationSimulation.industryMatch.percent.toFixed(1)}% of employment.`
          : `No Census sector matched “${inputs.desiredIndustry}”, so a fallback employer is harder to identify.`
        : 'Add your industry to test whether your field is represented here.',
    ],
    basis: 'measured',
  }
}

const healthcareAccessFactor = (context: RegretContext): RegretFactor => {
  const weight = 3
  const miles = context.destination.nearestHospitalMiles
  if (typeof miles !== 'number' || !Number.isFinite(miles))
    return unavailable(
      'healthcareAccess',
      'Healthcare access',
      weight,
      'Major-hospital locations have not loaded for this city.',
    )
  // Within 5 miles is urban-normal; 30 miles is a genuine access problem.
  const risk = clamp(((miles - 5) / 25) * 100)
  return {
    key: 'healthcareAccess',
    label: 'Healthcare access',
    risk,
    weight,
    level: levelOf(risk),
    headline: `${miles.toFixed(1)} miles to the nearest major hospital`,
    evidence: [
      'Distance is straight-line from the city centre to the closest HIFLD-listed hospital with 50+ beds.',
      'Specialist availability and insurance networks matter as much as distance — verify both.',
    ],
    basis: 'measured',
  }
}

const personalSafetyFactor = (context: RegretContext): RegretFactor => {
  const weight = 3
  const index = context.destination.violentCrimeIndex
  if (typeof index !== 'number' || !Number.isFinite(index))
    return unavailable(
      'personalSafety',
      'Reported crime',
      weight,
      'The FBI reported-crime series has not loaded for this state.',
    )
  // 70 sits well below the national average of 100; 190 is far above it.
  const absoluteRisk = clamp(((index - 70) / 120) * 100)
  const originIndex = context.origin?.violentCrimeIndex
  const delta =
    typeof originIndex === 'number' && Number.isFinite(originIndex)
      ? index - originIndex
      : null
  const deltaRisk = delta === null ? absoluteRisk : clamp((delta / 50) * 100)
  const risk = clamp(absoluteRisk * 0.6 + deltaRisk * 0.4)
  return {
    key: 'personalSafety',
    label: 'Reported crime',
    risk,
    weight,
    level: levelOf(risk),
    headline:
      index >= 100
        ? `Reported violent crime runs ${Math.round(index - 100)}% above the national average`
        : `Reported violent crime runs ${Math.round(100 - index)}% below the national average`,
    evidence: [
      'This is a STATE rate from the FBI Crime Data Explorer, not a city or neighbourhood rate. Crime varies enormously within a state, so treat it as context rather than a verdict on any address.',
      delta === null
        ? 'Set the city you live in now to compare this against your current state.'
        : `${signed(delta)} points versus ${context.origin?.name ?? 'your current state'}.`,
      'FBI figures depend on voluntary agency reporting, and coverage is incomplete in some states.',
    ],
    basis: 'estimated',
  }
}

const supportDistanceFactor = (context: RegretContext): RegretFactor => {
  const weight = 3
  const miles = context.supportNetworkMiles
  if (miles === null)
    return unavailable(
      'supportDistance',
      'Distance from support network',
      weight,
      'Set the city you live in now to measure how far the move takes you.',
    )
  // Same metro is negligible; 1,200 miles is a plane ride each visit.
  const risk = clamp((miles / 1_200) * 100)
  const driveHours = miles / 55
  return {
    key: 'supportDistance',
    label: 'Distance from support network',
    risk,
    weight,
    level: levelOf(risk),
    headline: `${Math.round(miles).toLocaleString()} miles from ${context.origin?.name ?? 'your current city'}`,
    evidence: [
      driveHours <= 8
        ? `Roughly ${driveHours.toFixed(1)} hours of driving — a weekend visit stays practical.`
        : 'Too far to drive for a weekend; expect flights for most visits.',
      'Straight-line distance between city centres, not a routed trip.',
    ],
    basis: 'measured',
  }
}

export const assessRegret = (context: RegretContext): RegretAssessment => {
  const factors: RegretFactor[] = [
    housingShockFactor(context),
    cashBufferFactor(context),
    salaryAdjustmentFactor(context),
    commuteShockFactor(context),
    climateMismatchFactor(context),
    hazardExposureFactor(context),
    jobConcentrationFactor(context),
    healthcareAccessFactor(context),
    personalSafetyFactor(context),
    supportDistanceFactor(context),
  ]

  const assessed = factors.filter((factor) => factor.basis !== 'unavailable')
  const totalWeight = assessed.reduce((sum, factor) => sum + factor.weight, 0)
  const score = totalWeight
    ? Math.round(
        assessed.reduce((sum, factor) => sum + factor.risk * factor.weight, 0) /
          totalWeight,
      )
    : 0
  const ranked = [...assessed].sort((a, b) => b.risk - a.risk)
  const topRisks = ranked.filter((factor) => factor.risk >= 40).slice(0, 3)
  const strengths = [...ranked].reverse().filter((factor) => factor.risk < 25)
  const coverage = Math.round((assessed.length / factors.length) * 100)
  const level = levelOf(score)

  const summary = topRisks.length
    ? `${regretLevelLabel[level]} regret risk. The pressure comes from ${topRisks
        .map((factor) => factor.label.toLowerCase())
        .join(', ')}.`
    : `${regretLevelLabel[level]} regret risk. No single factor stands out as a likely source of regret at these assumptions.`

  return {
    score,
    level,
    factors,
    assessed,
    topRisks,
    strengths: strengths.slice(0, 3),
    unavailable: factors.filter((factor) => factor.basis === 'unavailable'),
    summary,
    coverage,
  }
}
