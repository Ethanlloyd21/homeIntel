import type { ClimateProfile } from 'services/climate'
import type {
  CityLifeData,
  LifeInputs,
  LifeSimulation,
} from 'services/lifeSimulator'
import type { RegretAssessment } from 'services/regret'

export type BriefStatement = {
  text: string
  /** Where the statement came from: a dataset, or the user's own input. */
  source: string
}

export type BriefSection = {
  key: string
  title: string
  statements: BriefStatement[]
}

export type BriefVerdict =
  'strong-fit' | 'workable' | 'needs-caution' | 'poor-fit'

export type CityBrief = {
  verdict: BriefVerdict
  verdictLabel: string
  verdictLine: string
  confidence: 'High' | 'Medium' | 'Low'
  confidenceReason: string
  headline: string
  monthlyDelta: number | null
  fitScore: number
  regretScore: number
  fits: BriefStatement[]
  concerns: BriefStatement[]
  sections: BriefSection[]
  questions: string[]
  generatedAt: string
}

export type BriefContext = {
  cityName: string
  stateName: string
  destination: CityLifeData
  simulation: LifeSimulation
  origin: CityLifeData | null
  originName: string | null
  originSimulation: LifeSimulation | null
  climate: ClimateProfile | null
  regret: RegretAssessment
  inputs: LifeInputs
  confidenceLevels: { label: string; level: string }[]
}

const usd = (value: number) =>
  `$${Math.round(Math.abs(value)).toLocaleString()}`

const verdictLabels: Record<BriefVerdict, string> = {
  'strong-fit': 'Strong fit',
  workable: 'Workable with trade-offs',
  'needs-caution': 'Proceed with caution',
  'poor-fit': 'Poor fit at these assumptions',
}

const decideVerdict = (
  fitScore: number,
  regretScore: number,
  failures: number,
): BriefVerdict => {
  if (failures >= 3 || regretScore >= 70) return 'poor-fit'
  if (regretScore >= 50 || failures === 2) return 'needs-caution'
  if (fitScore >= 68 && regretScore < 32 && failures === 0) return 'strong-fit'
  return 'workable'
}

export const buildCityBrief = (context: BriefContext): CityBrief => {
  const {
    cityName,
    stateName,
    destination,
    simulation,
    originSimulation,
    originName,
    climate,
    regret,
    inputs,
    confidenceLevels,
  } = context

  const failures = simulation.requirements.filter(
    (requirement) => !requirement.passed,
  )
  const passes = simulation.requirements.length - failures.length
  const monthlyDelta = originSimulation
    ? originSimulation.totalMonthlyCosts - simulation.totalMonthlyCosts
    : null
  const verdict = decideVerdict(
    simulation.fitScore,
    regret.score,
    failures.length,
  )

  const fits: BriefStatement[] = []
  const concerns: BriefStatement[] = []

  if (monthlyDelta !== null) {
    const statement: BriefStatement = {
      text:
        monthlyDelta >= 0
          ? `Moving from ${originName} would leave roughly ${usd(monthlyDelta)} more in your pocket each month at the same standard of living.`
          : `Moving from ${originName} would cost roughly ${usd(monthlyDelta)} more each month at the same standard of living.`,
      source: 'HomeIntel simulator · Zillow, Census ACS, BEA price levels',
    }
    ;(monthlyDelta >= 0 ? fits : concerns).push(statement)
  }

  if (simulation.disposableIncome >= 0) {
    fits.push({
      text: `After every modeled cost you keep ${usd(simulation.disposableIncome)} a month, or ${((simulation.disposableIncome / (simulation.grossMonthlyIncome || 1)) * 100).toFixed(1)}% of gross income.`,
      source: 'HomeIntel simulator · your household inputs',
    })
  } else {
    concerns.push({
      text: `Modeled costs exceed income by ${usd(simulation.disposableIncome)} a month at these assumptions.`,
      source: 'HomeIntel simulator · your household inputs',
    })
  }

  if (simulation.housingBurdenPercent <= 35) {
    fits.push({
      text: `Total housing exposure is ${simulation.housingBurdenPercent.toFixed(1)}% of gross income, inside the conventional affordability range.`,
      source: 'Zillow ZHVI/ZORI or Census ACS · HomeIntel exposure model',
    })
  } else {
    concerns.push({
      text: `Total housing exposure reaches ${simulation.housingBurdenPercent.toFixed(1)}% of gross income once utilities, transport and hazard reserve are counted.`,
      source: 'Zillow ZHVI/ZORI or Census ACS · HomeIntel exposure model',
    })
  }

  for (const factor of regret.topRisks) {
    concerns.push({
      text: `${factor.label}: ${factor.headline}.`,
      source: factor.evidence[0] ?? 'HomeIntel regret engine',
    })
  }
  for (const factor of regret.strengths) {
    fits.push({
      text: `${factor.label}: ${factor.headline}.`,
      source: factor.evidence[0] ?? 'HomeIntel regret engine',
    })
  }

  const sections: BriefSection[] = [
    {
      key: 'money',
      title: 'Monthly financial difference',
      statements: [
        {
          text: `Gross ${usd(simulation.grossMonthlyIncome)}/mo − modeled costs ${usd(simulation.totalMonthlyCosts)}/mo = ${usd(simulation.disposableIncome)}${simulation.disposableIncome < 0 ? ' short' : ' remaining'}.`,
          source: 'HomeIntel simulator',
        },
        {
          text: `Housing ${usd(simulation.costs.find((cost) => cost.key === 'housing')?.value ?? 0)}/mo, transportation ${usd(simulation.costs.find((cost) => cost.key === 'transportation')?.value ?? 0)}/mo, hazard reserve ${usd(simulation.costs.find((cost) => cost.key === 'hazard')?.value ?? 0)}/mo.`,
          source: 'HomeIntel simulator cost lines',
        },
        {
          text: `Taxes use your ${inputs.effectiveTaxRate.toFixed(1)}% effective-rate assumption, not a filed return.`,
          source: 'Your input',
        },
      ],
    },
    {
      key: 'career',
      title: 'Career outlook',
      statements: [
        {
          text: `Employment rate ${destination.employmentRate.toFixed(1)}%, median worker earnings ${usd(destination.medianWorkerEarnings)}.`,
          source: 'Census ACS employment profile',
        },
        {
          text: inputs.desiredIndustry.trim()
            ? simulation.industryMatch.matched
              ? `Your field maps to ${simulation.industryMatch.label}, ${simulation.industryMatch.percent.toFixed(1)}% of local employment.`
              : `No Census sector matched “${inputs.desiredIndustry}” here.`
            : 'No industry keyword was set, so career fit is measured on the overall labour market only.',
          source: 'Census ACS industry shares',
        },
      ],
    },
    {
      key: 'housing',
      title: 'Housing trade-offs',
      statements: [
        {
          text: `Typical home value ${usd(destination.medianHomeValue)}, typical rent ${usd(destination.medianRent)}/mo.`,
          source: 'Zillow Research (ZHVI/ZORI) with Census ACS fallback',
        },
        {
          text:
            inputs.housingMode === 'buy'
              ? `Modeled at ${inputs.downPaymentPercent}% down and a ${inputs.mortgageRate.toFixed(2)}% 30-year rate, plus a 1.8%/yr tax-and-insurance allowance.`
              : 'Modeled on the typical market rent, so a specific unit may differ materially.',
          source: 'Your input · HomeIntel mortgage model',
        },
      ],
    },
    {
      key: 'climate',
      title: 'Climate, hazard and crime',
      statements: [
        climate
          ? {
              text: `${climate.comfortableDaysPerYear} days a year sit in your ${inputs.comfortLowF}–${inputs.comfortHighF}°F range; ${climate.hotDaysPerYear} ${climate.hotDaysPerYear === 1 ? 'reaches' : 'reach'} 90°F and ${climate.freezingDaysPerYear} ${climate.freezingDaysPerYear === 1 ? 'night freezes' : 'nights freeze'}.`,
              source: `Open-Meteo archive, ${climate.yearsObserved} years of observed daily weather`,
            }
          : {
              text: 'Historical weather has not loaded, so climate fit is not assessed.',
              source: 'Open-Meteo archive',
            },
        {
          text: `FEMA expected annual loss score ${Math.round(destination.riskScore)}/100 for the census tract at the city centre.`,
          source: 'FEMA National Risk Index',
        },
        typeof destination.violentCrimeIndex === 'number'
          ? {
              text: `Reported violent crime sits at ${Math.round(destination.violentCrimeIndex)} against a national average of 100 — a state-level rate, not a city or neighbourhood one.`,
              source:
                'FBI Crime Data Explorer 2023; voluntary agency reporting is incomplete',
            }
          : {
              text: 'No reported-crime rate was available for this state.',
              source: 'FBI Crime Data Explorer',
            },
      ],
    },
    {
      key: 'access',
      title: 'Healthcare and education access',
      statements: [
        {
          text:
            typeof destination.nearestHospitalMiles === 'number'
              ? `Nearest major hospital is ${destination.nearestHospitalMiles.toFixed(1)} miles from the city centre.`
              : 'No major hospital distance was matched for this city.',
          source: 'HIFLD hospital facilities',
        },
        {
          text: `${destination.collegeEducatedPercent.toFixed(1)}% of adults hold a bachelor's degree or higher.`,
          source: 'Census ACS educational attainment',
        },
      ],
    },
    {
      key: 'requirements',
      title: 'Your non-negotiables',
      statements: [
        {
          text: `${passes} of ${simulation.requirements.length} deal-breakers pass.`,
          source: 'Your deal-breaker settings',
        },
        ...failures.map((failure) => ({
          text: `Fails ${failure.label.toLowerCase()}: ${failure.actual} against your rule of ${failure.rule.toLowerCase()}.`,
          source: 'Your deal-breaker settings',
        })),
      ],
    },
  ]

  const questions = [
    `Ask a local insurance broker for an address-level quote — the FEMA score of ${Math.round(destination.riskScore)} is a tract average, not your property.`,
    inputs.housingMode === 'buy'
      ? 'Confirm the actual property-tax rate and any HOA or special assessment on the homes you shortlist.'
      : 'Confirm what the quoted rent includes: utilities, parking, pet fees, and the renewal increase history.',
    'Drive your real commute at 8 AM and again at 5:30 PM on a weekday, not midday.',
    inputs.childcareMonthly > 0 || inputs.householdSize > 2
      ? 'Call two childcare centres and two schools about waitlists before you sign anything.'
      : 'Check whether your healthcare providers and prescriptions are in-network locally.',
    ...regret.topRisks.map(
      (factor) =>
        `Investigate ${factor.label.toLowerCase()}: ${factor.headline.toLowerCase()}.`,
    ),
    ...regret.unavailable
      .slice(0, 2)
      .map(
        (factor) =>
          `Still unassessed — ${factor.label.toLowerCase()}: ${factor.evidence[0]}`,
      ),
  ]

  const lowConfidence = confidenceLevels.filter((entry) =>
    ['Estimated', 'Unavailable', 'Loading'].includes(entry.level),
  )
  const confidence =
    lowConfidence.length === 0 && regret.coverage >= 80
      ? 'High'
      : lowConfidence.length <= 2 && regret.coverage >= 55
        ? 'Medium'
        : 'Low'

  return {
    verdict,
    verdictLabel: verdictLabels[verdict],
    verdictLine:
      verdict === 'strong-fit'
        ? `${cityName} clears every rule you set and carries little regret pressure at these assumptions.`
        : verdict === 'workable'
          ? `${cityName} works, but with trade-offs you should price in deliberately.`
          : verdict === 'needs-caution'
            ? `${cityName} is viable only if you resolve the specific risks below first.`
            : `${cityName} does not fit the household and rules you described.`,
    confidence,
    confidenceReason:
      lowConfidence.length === 0
        ? `Every input category returned a verified source, and ${regret.coverage}% of regret factors could be assessed.`
        : `${lowConfidence.map((entry) => entry.label).join(', ')} ${lowConfidence.length === 1 ? 'is' : 'are'} estimated or missing, and ${regret.coverage}% of regret factors could be assessed.`,
    headline: `${cityName}, ${stateName} — ${verdictLabels[verdict].toLowerCase()}`,
    monthlyDelta,
    fitScore: simulation.fitScore,
    regretScore: regret.score,
    fits: fits.slice(0, 6),
    concerns: concerns.slice(0, 6),
    sections,
    questions: [...new Set(questions)].slice(0, 8),
    generatedAt: new Date().toISOString(),
  }
}
