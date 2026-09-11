import assert from 'node:assert/strict'
import test from 'node:test'
import { buildClimateProfile, comfortDelta } from '../src/services/climate.ts'
import { buildDayScenarios } from '../src/services/dayInLife.ts'
import {
  calculateLifeSimulation,
  defaultDealBreakers,
  defaultLifeInputs,
  defaultPreferenceWeights,
} from '../src/services/lifeSimulator.ts'
import { buildMoveBudget, buildMoveTasks } from '../src/services/movePlan.ts'
import {
  assessRegret,
  employmentConcentration,
} from '../src/services/regret.ts'

/** Two full years of synthetic daily weather: a mild spring, a hot summer. */
const syntheticRecords = (highFor) => {
  const records = []
  const start = new Date(Date.UTC(2023, 0, 1))
  for (let index = 0; index < 730; index += 1) {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + index)
    const iso = date.toISOString().slice(0, 10)
    const month = date.getUTCMonth() + 1
    const high = highFor(month)
    records.push({
      date: iso,
      high,
      low: high - 18,
      precipitation: month === 4 ? 0.2 : 0,
      snowfall: month === 1 ? 0.5 : 0,
      weatherCode: 1,
      sunrise: `${iso}T06:15`,
      sunset: `${iso}T19:45`,
      daylightSeconds: 48_600,
    })
  }
  return records
}

const mildCity = syntheticRecords((month) =>
  month >= 4 && month <= 10 ? 72 : 50,
)
// Summer bakes and the rest of the year still sits above the comfort band.
const hotCity = syntheticRecords((month) =>
  month >= 5 && month <= 9 ? 98 : 86,
)

const cityData = {
  name: 'Test City',
  medianRent: 1_600,
  medianHomeValue: 300_000,
  costOfLivingIndex: 100,
  employmentRate: 96,
  medianWorkerEarnings: 55_000,
  collegeEducatedPercent: 40,
  riskScore: 30,
  industries: [
    { name: 'Technology & professional services', percent: 20 },
    { name: 'Health & education', percent: 20 },
    { name: 'Retail', percent: 20 },
    { name: 'Manufacturing', percent: 20 },
    { name: 'Construction', percent: 20 },
  ],
}

test('climate profile counts comfortable days inside the chosen band', () => {
  const profile = buildClimateProfile(mildCity, { lowF: 60, highF: 82 })
  assert.ok(profile)
  // Apr-Oct is 214 days a year at 72F; everything else sits at 50F.
  assert.ok(Math.abs(profile.comfortableDaysPerYear - 214) <= 2)
  // April is the only wet month in the fixture, so pleasant days exclude it.
  assert.ok(profile.pleasantDaysPerYear < profile.comfortableDaysPerYear)
  assert.equal(profile.hotDaysPerYear, 0)
})

test('a narrower comfort band yields fewer comfortable days', () => {
  const wide = buildClimateProfile(mildCity, { lowF: 45, highF: 90 })
  const narrow = buildClimateProfile(mildCity, { lowF: 68, highF: 75 })
  assert.ok(wide.comfortableDaysPerYear > narrow.comfortableDaysPerYear)
})

test('climate profile flags a hot city and reports the comfort delta', () => {
  const hot = buildClimateProfile(hotCity, { lowF: 60, highF: 82 })
  const mild = buildClimateProfile(mildCity, { lowF: 60, highF: 82 })
  assert.ok(hot.hotDaysPerYear > 140)
  assert.ok(comfortDelta(hot, mild) < 0)
  assert.equal(hot.comfortableDaysPerYear, 0)
})

test('climate profile refuses to summarise too little data', () => {
  assert.equal(buildClimateProfile(mildCity.slice(0, 30)), null)
})

const thirteenSectors = (top) => {
  const rest = (100 - top) / 12
  return [
    { name: 'Dominant sector', percent: top },
    ...Array.from({ length: 12 }, (_, index) => ({
      name: `Sector ${index}`,
      percent: rest,
    })),
  ]
}

test('employment concentration separates a diverse mix from a dominant sector', () => {
  // A perfectly even 13-way split is the floor of the scale.
  assert.equal(employmentConcentration(thirteenSectors(100 / 13)), 0)
  const typical = employmentConcentration(thirteenSectors(24))
  const dominant = employmentConcentration(thirteenSectors(45))
  assert.ok(typical > 0 && typical < 50, `typical city scored ${typical}`)
  assert.ok(dominant > typical + 25, `dominant city scored ${dominant}`)
  assert.equal(employmentConcentration([]), null)
})

const simulate = (data = cityData, inputs = defaultLifeInputs) =>
  calculateLifeSimulation(
    data,
    inputs,
    defaultDealBreakers,
    defaultPreferenceWeights,
  )

const regretContext = (overrides = {}) => ({
  destination: cityData,
  destinationSimulation: simulate(),
  origin: null,
  originSimulation: null,
  destinationClimate: buildClimateProfile(mildCity),
  originClimate: null,
  inputs: defaultLifeInputs,
  supportNetworkMiles: null,
  originCommuteMinutes: null,
  ...overrides,
})

test('reported crime lowers the safety dimension and adds a regret factor', () => {
  const safeCity = { ...cityData, violentCrimeIndex: 70 }
  const unsafeCity = { ...cityData, violentCrimeIndex: 190 }
  // Without a crime index the safety dimension is the hazard score alone.
  assert.equal(simulate().dimensions.safety, 70)
  assert.ok(
    simulate(safeCity).dimensions.safety >
      simulate(unsafeCity).dimensions.safety,
  )

  const calm = assessRegret(
    regretContext({
      destination: safeCity,
      destinationSimulation: simulate(safeCity),
    }),
  )
  const rough = assessRegret(
    regretContext({
      destination: unsafeCity,
      destinationSimulation: simulate(unsafeCity),
    }),
  )
  const calmFactor = calm.assessed.find((item) => item.key === 'personalSafety')
  const roughFactor = rough.assessed.find(
    (item) => item.key === 'personalSafety',
  )
  assert.equal(calmFactor.risk, 0)
  assert.ok(roughFactor.risk > 80)
  assert.match(roughFactor.headline, /above the national average/)
  // The state-level caveat must always travel with the number.
  assert.match(roughFactor.evidence[0], /STATE rate/)
})

test('a crime deal-breaker appears only once a crime index exists', () => {
  const withCrime = simulate({ ...cityData, violentCrimeIndex: 150 })
  const rule = withCrime.requirements.find(
    (item) => item.label === 'Reported crime',
  )
  assert.ok(rule)
  assert.equal(rule.passed, false)
  assert.ok(
    !simulate().requirements.some((item) => item.label === 'Reported crime'),
  )
})

test('regret assessment only weights factors it could actually measure', () => {
  const result = assessRegret(regretContext())
  assert.equal(result.factors.length, 10)
  assert.ok(result.unavailable.length > 0)
  assert.equal(
    result.assessed.length + result.unavailable.length,
    result.factors.length,
  )
  assert.ok(result.score >= 0 && result.score <= 100)
  assert.equal(
    result.coverage,
    Math.round((result.assessed.length / result.factors.length) * 100),
  )
  for (const factor of result.unavailable) {
    assert.equal(factor.basis, 'unavailable')
    assert.ok(factor.evidence[0].length > 0)
  }
})

test('a measured commute and hospital distance raise coverage', () => {
  const withContext = assessRegret(
    regretContext({
      destination: {
        ...cityData,
        commuteMinutes: 52,
        nearestHospitalMiles: 24,
      },
      destinationSimulation: simulate({
        ...cityData,
        commuteMinutes: 52,
        nearestHospitalMiles: 24,
      }),
    }),
  )
  const without = assessRegret(regretContext())
  assert.ok(withContext.coverage > without.coverage)
  const commute = withContext.assessed.find(
    (item) => item.key === 'commuteShock',
  )
  assert.ok(commute.risk > 50, 'a 52-minute commute should read as elevated')
})

test('a hostile climate scores higher regret than a mild one', () => {
  const mild = assessRegret(regretContext())
  const hot = assessRegret(
    regretContext({ destinationClimate: buildClimateProfile(hotCity) }),
  )
  const mildFactor = mild.assessed.find(
    (item) => item.key === 'climateMismatch',
  )
  const hotFactor = hot.assessed.find((item) => item.key === 'climateMismatch')
  assert.ok(hotFactor.risk > mildFactor.risk)
})

test('losing real purchasing power is reported as salary-adjustment risk', () => {
  const inputs = {
    ...defaultLifeInputs,
    currentAnnualIncome: 120_000,
    annualIncome: 90_000,
  }
  const result = assessRegret(
    regretContext({
      inputs,
      destinationSimulation: simulate(cityData, inputs),
    }),
  )
  const salary = result.assessed.find((item) => item.key === 'salaryAdjustment')
  assert.ok(salary.risk > 60)
  assert.match(salary.headline, /buys .* less/)
})

test('the conditional deal-breakers appear only when the data exists', () => {
  const bare = simulate()
  const rich = simulate({
    ...cityData,
    commuteMinutes: 25,
    nearestHospitalMiles: 4,
    comfortableDaysPerYear: 200,
  })
  assert.equal(rich.requirements.length, bare.requirements.length + 3)
  const commute = rich.requirements.find(
    (item) => item.label === 'Commute time',
  )
  assert.equal(commute.passed, true)
})

test('day scenarios read their times from the observed record', () => {
  const scenarios = buildDayScenarios({
    cityName: 'Test City',
    climate: buildClimateProfile(mildCity),
    inputs: defaultLifeInputs,
    commuteMinutes: 31,
    commuteMilesMeasured: 12,
    trafficDelayPercent: 18,
    transitStopCount: 4,
    nearestHospital: { name: 'Test General', miles: 6.4 },
    nearestSchool: null,
    nearestCollege: null,
    fuelCostPerCommuteDay: 2.91,
  })
  assert.equal(scenarios.length, 5)
  const workday = scenarios.find((item) => item.key === 'workday')
  assert.equal(workday.conditions.sunrise, '6:15 AM')
  assert.equal(workday.conditions.sunset, '7:45 PM')
  // Wake is 25 minutes before sunrise, departure an hour after it.
  assert.equal(workday.moments[0].time, '5:50 AM')
  assert.equal(workday.moments[1].time, '7:15 AM')
  assert.match(workday.moments[1].detail, /31 minutes each way/)
  assert.ok(workday.moments.every((moment) => moment.source.length > 0))

  const remote = scenarios.find((item) => item.key === 'remote')
  assert.ok(
    remote.moments.every((moment) => !/leave for work/i.test(moment.title)),
  )
})

test('move budget totals its lines and respects a manual override', () => {
  const budget = buildMoveBudget(defaultLifeInputs, 1_600, 900)
  const sum = budget.lines.reduce((total, line) => total + line.amount, 0)
  assert.equal(budget.total, sum)
  assert.ok(budget.lines.every((line) => line.derived))

  const overridden = buildMoveBudget(defaultLifeInputs, 1_600, 900, {
    movers: 5_000,
  })
  const movers = overridden.lines.find((line) => line.id === 'movers')
  assert.equal(movers.amount, 5_000)
  assert.equal(movers.derived, false)
  assert.equal(
    overridden.total,
    budget.total -
      budget.lines.find((line) => line.id === 'movers').amount +
      5_000,
  )
})

test('move tasks add family steps only for households that need them', () => {
  const couple = buildMoveTasks(defaultLifeInputs, 'Test City')
  const family = buildMoveTasks(
    { ...defaultLifeInputs, householdSize: 4 },
    'Test City',
  )
  assert.ok(family.length > couple.length)
  assert.ok(family.some((task) => task.id === 'schools'))
  assert.ok(!couple.some((task) => task.id === 'schools'))
  assert.ok(couple.every((task) => task.detail.length > 0))
})
