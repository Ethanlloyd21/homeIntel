import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateConsensusScore,
  calculateLifeSimulation,
  defaultDealBreakers,
  defaultLifeInputs,
  defaultPreferenceWeights,
  monthlyMortgagePayment,
} from '../src/services/lifeSimulator.ts'

const city = {
  name: 'Test City',
  medianRent: 1_600,
  medianHomeValue: 300_000,
  costOfLivingIndex: 100,
  employmentRate: 96,
  medianWorkerEarnings: 55_000,
  collegeEducatedPercent: 40,
  riskScore: 30,
  industries: [{ name: 'Technology & professional services', percent: 14 }],
}

test('calculates a standard fixed-rate mortgage deterministically', () => {
  const payment = monthlyMortgagePayment(300_000, 20, 6.5)
  assert.equal(Math.round(payment), 1_517)
})

test('returns itemized costs that reconcile to the total', () => {
  const result = calculateLifeSimulation(
    city,
    defaultLifeInputs,
    defaultDealBreakers,
    defaultPreferenceWeights,
  )
  const itemizedTotal = result.costs.reduce((sum, item) => sum + item.value, 0)

  assert.equal(result.totalMonthlyCosts, itemizedTotal)
  assert.equal(
    result.disposableIncome,
    result.grossMonthlyIncome - result.totalMonthlyCosts,
  )
  assert.ok(result.fitScore >= 0 && result.fitScore <= 100)
  assert.ok(result.regretScore >= 0 && result.regretScore <= 100)
})

test('deal-breakers fail with explainable actual and rule values', () => {
  const result = calculateLifeSimulation(
    city,
    { ...defaultLifeInputs, desiredIndustry: 'healthcare' },
    {
      ...defaultDealBreakers,
      maximumHousing: 1_000,
      requireIndustryMatch: true,
    },
    defaultPreferenceWeights,
  )

  const housingRule = result.requirements.find(
    (requirement) => requirement.label === 'Housing budget',
  )
  const careerRule = result.requirements.find(
    (requirement) => requirement.label === 'Career field represented',
  )
  assert.equal(housingRule?.passed, false)
  assert.match(housingRule?.actual ?? '', /\/mo/)
  assert.equal(careerRule?.passed, false)
})

test('consensus is the mean of both independently weighted scores', () => {
  const result = calculateLifeSimulation(
    city,
    defaultLifeInputs,
    defaultDealBreakers,
    defaultPreferenceWeights,
  )
  const consensus = calculateConsensusScore(
    result.dimensions,
    defaultPreferenceWeights,
    { affordability: 0, career: 0, safety: 5, community: 0 },
  )

  assert.equal(
    consensus.combinedScore,
    Math.round((consensus.firstScore + consensus.secondScore) / 2),
  )
  assert.ok(consensus.alignment >= 0 && consensus.alignment <= 100)
})
