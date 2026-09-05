import {
  AlertTriangle,
  BriefcaseBusiness,
  BookOpen,
  Calculator,
  Check,
  CircleHelp,
  ClipboardCheck,
  Database,
  HeartHandshake,
  Home,
  SlidersHorizontal,
  Target,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import CitySelect from 'components/CitySelect'
import LoadingSpinner from 'components/LoadingSpinner'
import type { City } from 'data/cities'
import { useComparisonIndicesQuery } from 'hooks/useComparisonIndicesQuery'
import { useDemographicsQuery } from 'hooks/useDemographicsQuery'
import { useEmploymentQuery } from 'hooks/useEmploymentQuery'
import { useHousingQuery } from 'hooks/useHousingQuery'
import { useRiskQuery } from 'hooks/useRiskQuery'
import {
  calculateConsensusScore,
  calculateLifeSimulation,
  defaultDealBreakers,
  defaultLifeInputs,
  defaultPreferenceWeights,
  type CityLifeData,
  type DealBreakers,
  type LifeInputs,
  type PreferenceWeights,
} from 'services/lifeSimulator'
import { money } from 'utils/formatters'

const checklistItems = [
  'Confirm income or employment before moving',
  'Verify taxes with a qualified source',
  'Request property-specific insurance quotes',
  'Research neighborhoods and commute at peak time',
  'Review school or childcare availability',
  'Check healthcare providers and coverage',
  'Build an emergency and moving-cost reserve',
  'Plan a test visit during a difficult season',
]

const loadStored = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? ({ ...fallback, ...JSON.parse(saved) } as T) : fallback
  } catch {
    return fallback
  }
}

const fieldHelp: Record<string, string> = {
  'Annual household income':
    'The combined gross income your household expects to earn in one year, before taxes.',
  'Household size':
    'The number of adults and children whose groceries, utilities, and other shared costs should be estimated.',
  'Housing plan':
    'Choose Rent to use typical monthly rent, or Buy to estimate a mortgage, property tax, and insurance.',
  'Effective tax assumption':
    'The percentage of gross income you expect to pay across federal, state, local, and payroll taxes. This is your planning assumption, not tax advice.',
  'Down payment':
    'The percentage of the typical home value you expect to pay upfront when buying.',
  'Mortgage rate':
    'The annual interest rate used to estimate principal and interest on a 30-year fixed mortgage.',
  'One-way commute':
    'The distance from home to work in one direction. The simulator doubles it for the return trip.',
  'Commute days per week':
    'How many days each week you expect to travel to your workplace.',
  'Healthcare per month':
    'Your expected monthly premiums and out-of-pocket healthcare spending.',
  'Childcare per month':
    'Your expected monthly daycare, after-school care, or other childcare expense.',
  'Debt payments per month':
    'Required monthly payments for credit cards, student loans, vehicles, or other debt.',
  'Other essentials per month':
    'Recurring necessities not already listed, such as phone service, clothing, or household supplies.',
  'Vehicle efficiency':
    'Your vehicle’s average miles per gallon. A higher number lowers estimated commute fuel cost.',
  'Gas price per gallon':
    'The fuel price you want used for the monthly commute calculation.',
  'Maximum housing':
    'The most you are willing to spend monthly on rent or the modeled mortgage, tax, and insurance amount.',
  'Minimum cash remaining':
    'The minimum disposable income you want left after all modeled monthly costs.',
  'Maximum FEMA risk':
    'The highest FEMA Expected Annual Loss score you are comfortable accepting. Lower risk scores are preferable.',
  'Minimum employment rate':
    'The lowest acceptable share of participating civilian workers who are employed.',
  'Your industry keyword':
    'A word such as technology, healthcare, construction, or finance used to match your career against Census industry categories.',
}

const confidenceHelp: Record<string, string> = {
  High: 'Good source confidence. The value comes from a recent authoritative source at a relevant city or tract geography. It can still be an estimate.',
  Medium:
    'Useful but less precise. The source may be broader than the city, older, or a fallback rather than the preferred dataset.',
  Estimated:
    'Use cautiously. HomeIntel is applying a transparent planning estimate because a more precise city value is unavailable.',
  Loading:
    'The source is still loading. The rating may change when it arrives.',
  Unavailable:
    'No verified source value was returned. Do not rely on this category until the missing information is confirmed.',
}

const HelpTip = ({ label, text }: { label: string; text: string }) => {
  const id = useId()
  return (
    <span className="sim-help">
      <button type="button" aria-label={`About ${label}`} aria-describedby={id}>
        <CircleHelp size={14} aria-hidden="true" />
      </button>
      <span className="sim-tooltip" id={id} role="tooltip">
        {text}
      </span>
    </span>
  )
}

const FieldLabel = ({ label }: { label: string }) => (
  <span className="sim-field-label">
    {label}
    <HelpTip
      label={label}
      text={fieldHelp[label] ?? `Information about ${label}.`}
    />
  </span>
)

const ConfidenceBadge = ({ level }: { level: string }) => {
  const id = useId()
  const description = confidenceHelp[level] ?? confidenceHelp.Estimated
  return (
    <span className="confidence-help">
      <button
        type="button"
        className={`confidence-${level.toLowerCase()}`}
        aria-label={`${level} data confidence. ${description}`}
        aria-describedby={id}
      >
        {level} <CircleHelp size={12} aria-hidden="true" />
      </button>
      <span className="sim-tooltip" id={id} role="tooltip">
        <strong>{level} confidence.</strong> {description}
      </span>
    </span>
  )
}

const CurrencyInput = ({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
}) => (
  <label className="sim-field">
    <FieldLabel label={label} />
    <div className="sim-number-input">
      <i>$</i>
      <input
        type="number"
        min={min}
        step="50"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  </label>
)

const NumberInput = ({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
}) => (
  <label className="sim-field">
    <FieldLabel label={label} />
    <div className="sim-number-input">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {suffix && <i>{suffix}</i>}
    </div>
  </label>
)

const WeightControls = ({
  name,
  value,
  onChange,
}: {
  name: string
  value: PreferenceWeights
  onChange: (value: PreferenceWeights) => void
}) => (
  <div className="consensus-person">
    <strong>{name}</strong>
    {(Object.keys(value) as (keyof PreferenceWeights)[]).map((key) => (
      <label key={key}>
        <span>{key}</span>
        <input
          type="range"
          min="0"
          max="5"
          value={value[key]}
          onChange={(event) =>
            onChange({ ...value, [key]: Number(event.target.value) })
          }
        />
        <b>{value[key]}</b>
      </label>
    ))}
  </div>
)

const SimulatorScore = ({
  label,
  score,
  tone,
}: {
  label: string
  score: number
  tone: 'good' | 'warning'
}) => (
  <div className={`sim-score sim-score-${tone}`}>
    <span>{label}</span>
    <strong>{score}</strong>
    <small>out of 100</small>
  </div>
)

type SimulatorCityQueries = {
  housing: ReturnType<typeof useHousingQuery>
  demographics: ReturnType<typeof useDemographicsQuery>
  employment: ReturnType<typeof useEmploymentQuery>
  risk: ReturnType<typeof useRiskQuery>
  indices: ReturnType<typeof useComparisonIndicesQuery>
}

const cityDataFromQueries = (
  city: City,
  queries: SimulatorCityQueries,
): CityLifeData => {
  const costOfLivingIndex = queries.indices.data?.costOfLivingIndex || 100
  return {
    name: city.name,
    medianRent:
      queries.housing.data?.medianRent ||
      city.rent ||
      1_500 * (costOfLivingIndex / 100),
    medianHomeValue:
      queries.housing.data?.medianHomeValue ||
      city.home ||
      300_000 * (costOfLivingIndex / 100),
    costOfLivingIndex,
    employmentRate:
      queries.employment.data?.employmentRate || city.employed || 90,
    medianWorkerEarnings:
      queries.employment.data?.medianWorkerEarnings ||
      city.income ||
      50_000 * (costOfLivingIndex / 100),
    collegeEducatedPercent:
      queries.demographics.data?.collegeEducatedPercent || city.college,
    riskScore: queries.risk.data?.score ?? (city.risk || 50),
    industries: queries.employment.data?.industries ?? [],
  }
}

const LifeSimulatorPage = ({
  city,
  comparisonCity,
  setComparisonCity,
}: {
  city: City
  comparisonCity: City | null
  setComparisonCity: (city: City) => void
}) => {
  const [inputs, setInputs] = useState<LifeInputs>(() =>
    loadStored('homeintel-life-inputs', defaultLifeInputs),
  )
  const [dealBreakers, setDealBreakers] = useState<DealBreakers>(() =>
    loadStored('homeintel-deal-breakers', defaultDealBreakers),
  )
  const [firstWeights, setFirstWeights] = useState<PreferenceWeights>(() =>
    loadStored('homeintel-first-preferences', defaultPreferenceWeights),
  )
  const [secondWeights, setSecondWeights] = useState<PreferenceWeights>(() =>
    loadStored('homeintel-second-preferences', {
      affordability: 3,
      career: 2,
      safety: 5,
      community: 4,
    }),
  )
  const [checklists, setChecklists] = useState<Record<string, string[]>>(() =>
    loadStored('homeintel-readiness', {}),
  )
  const completed = checklists[city.id] ?? []
  const [guideOpen, setGuideOpen] = useState(
    () => localStorage.getItem('homeintel-simulator-guide') !== 'hidden',
  )

  const leftHousing = useHousingQuery(city)
  const leftDemographics = useDemographicsQuery(city, true, false)
  const leftEmployment = useEmploymentQuery(city, true, false)
  const leftRisk = useRiskQuery(city)
  const leftIndices = useComparisonIndicesQuery(city)
  const rightQueryCity = comparisonCity ?? city
  const rightHousing = useHousingQuery(rightQueryCity, Boolean(comparisonCity))
  const rightDemographics = useDemographicsQuery(
    rightQueryCity,
    Boolean(comparisonCity),
    false,
  )
  const rightEmployment = useEmploymentQuery(
    rightQueryCity,
    Boolean(comparisonCity),
    false,
  )
  const rightRisk = useRiskQuery(rightQueryCity, Boolean(comparisonCity))
  const rightIndices = useComparisonIndicesQuery(
    rightQueryCity,
    Boolean(comparisonCity),
  )

  const leftQueries = {
    housing: leftHousing,
    demographics: leftDemographics,
    employment: leftEmployment,
    risk: leftRisk,
    indices: leftIndices,
  }
  const rightQueries = {
    housing: rightHousing,
    demographics: rightDemographics,
    employment: rightEmployment,
    risk: rightRisk,
    indices: rightIndices,
  }
  const leftData = cityDataFromQueries(city, leftQueries)
  const rightData = cityDataFromQueries(rightQueryCity, rightQueries)
  const leftResult = useMemo(
    () => calculateLifeSimulation(leftData, inputs, dealBreakers, firstWeights),
    [leftData, inputs, dealBreakers, firstWeights],
  )
  const rightResult = useMemo(
    () =>
      comparisonCity
        ? calculateLifeSimulation(rightData, inputs, dealBreakers, firstWeights)
        : null,
    [comparisonCity, rightData, inputs, dealBreakers, firstWeights],
  )
  const leftConsensus = calculateConsensusScore(
    leftResult.dimensions,
    firstWeights,
    secondWeights,
  )
  const rightConsensus = rightResult
    ? calculateConsensusScore(
        rightResult.dimensions,
        firstWeights,
        secondWeights,
      )
    : null
  const pending = Object.values(leftQueries).some((query) => query.isPending)

  useEffect(() => {
    localStorage.setItem('homeintel-life-inputs', JSON.stringify(inputs))
    localStorage.setItem(
      'homeintel-deal-breakers',
      JSON.stringify(dealBreakers),
    )
    localStorage.setItem(
      'homeintel-first-preferences',
      JSON.stringify(firstWeights),
    )
    localStorage.setItem(
      'homeintel-second-preferences',
      JSON.stringify(secondWeights),
    )
  }, [inputs, dealBreakers, firstWeights, secondWeights])

  const updateInput = <K extends keyof LifeInputs>(
    key: K,
    value: LifeInputs[K],
  ) => setInputs((current) => ({ ...current, [key]: value }))
  const updateRule = <K extends keyof DealBreakers>(
    key: K,
    value: DealBreakers[K],
  ) => setDealBreakers((current) => ({ ...current, [key]: value }))
  const toggleChecklist = (item: string) => {
    const next = completed.includes(item)
      ? completed.filter((value) => value !== item)
      : [...completed, item]
    const nextChecklists = { ...checklists, [city.id]: next }
    setChecklists(nextChecklists)
    localStorage.setItem('homeintel-readiness', JSON.stringify(nextChecklists))
  }
  const toggleGuide = () => {
    const next = !guideOpen
    setGuideOpen(next)
    localStorage.setItem(
      'homeintel-simulator-guide',
      next ? 'visible' : 'hidden',
    )
  }

  const confidence = [
    {
      label: 'Housing',
      level: leftHousing.isPending
        ? 'Loading'
        : leftHousing.data?.homeValueNote.startsWith('ZHVI')
          ? 'High'
          : leftHousing.data
            ? 'Medium'
            : 'Unavailable',
      note: leftHousing.data?.homeValueNote ?? 'Waiting for market data',
    },
    {
      label: 'People',
      level: leftDemographics.isPending
        ? 'Loading'
        : leftDemographics.data
          ? 'High'
          : 'Unavailable',
      note: 'Census ACS place estimate',
    },
    {
      label: 'Career',
      level: leftEmployment.isPending
        ? 'Loading'
        : leftEmployment.data
          ? 'High'
          : 'Unavailable',
      note: 'Census ACS employment profile',
    },
    {
      label: 'Hazard',
      level: leftRisk.isPending
        ? 'Loading'
        : leftRisk.data
          ? 'High'
          : 'Unavailable',
      note: 'FEMA National Risk Index tract result',
    },
    {
      label: 'Living costs',
      level: leftIndices.data?.costOfLivingIndex ? 'Medium' : 'Estimated',
      note: 'BEA state price level; not neighborhood-specific',
    },
  ]

  return (
    <div className="simulator-page">
      <div className="simulator-hero">
        <div>
          <p className="eyebrow">LIFE SIMULATOR</p>
          <h2>Preview your life in {city.name}</h2>
          <span>
            Change an assumption and every cost, requirement, and score updates
            instantly. No AI is used in these calculations.
          </span>
        </div>
        <div className="simulator-hero-actions">
          {pending && <LoadingSpinner label="Refreshing verified city data" />}
          <button
            type="button"
            className="sim-guide-toggle"
            aria-expanded={guideOpen}
            aria-controls="simulator-guide"
            onClick={toggleGuide}
          >
            <BookOpen size={17} /> {guideOpen ? 'Hide guide' : 'How to use'}
          </button>
        </div>
      </div>

      {guideOpen && (
        <section className="card simulator-guide" id="simulator-guide">
          <div className="sim-guide-heading">
            <div>
              <span>
                <BookOpen size={18} />
              </span>
              <div>
                <small>QUICK START</small>
                <h3>How to use the Life Simulator</h3>
              </div>
            </div>
            <p>
              Start with your real household numbers. Results recalculate as you
              type, and your settings are saved on this device.
            </p>
          </div>
          <div className="sim-guide-steps">
            <a href="#sim-household">
              <b>1</b>
              <span>
                <strong>Describe your household</strong>
                <small>
                  Enter income, housing plan, commute, and recurring costs.
                </small>
              </span>
            </a>
            <a href="#sim-results">
              <b>2</b>
              <span>
                <strong>Review the monthly result</strong>
                <small>
                  Open any cost row to see its formula or assumption.
                </small>
              </span>
            </a>
            <a href="#sim-rules">
              <b>3</b>
              <span>
                <strong>Set your non-negotiables</strong>
                <small>
                  Define limits and see exactly which requirements fail.
                </small>
              </span>
            </a>
            <a href="#sim-consensus">
              <b>4</b>
              <span>
                <strong>Compare priorities</strong>
                <small>
                  Add a second person or city to find the best compromise.
                </small>
              </span>
            </a>
          </div>
          <p className="sim-guide-tip">
            <strong>Tip:</strong> The fit score is a summary, not the answer.
            Check the cash remaining, failed deal-breakers, and data confidence
            before making a decision.
          </p>
        </section>
      )}

      <section className="card simulator-assumptions" id="sim-household">
        <div className="sim-section-heading">
          <span>
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <small>YOUR HOUSEHOLD</small>
            <h3>Monthly assumptions</h3>
          </div>
        </div>
        <div className="sim-form-grid">
          <CurrencyInput
            label="Annual household income"
            value={inputs.annualIncome}
            onChange={(value) => updateInput('annualIncome', value)}
          />
          <NumberInput
            label="Household size"
            value={inputs.householdSize}
            min={1}
            max={12}
            onChange={(value) => updateInput('householdSize', value)}
          />
          <label className="sim-field">
            <FieldLabel label="Housing plan" />
            <select
              value={inputs.housingMode}
              onChange={(event) =>
                updateInput('housingMode', event.target.value as 'rent' | 'buy')
              }
            >
              <option value="rent">Rent</option>
              <option value="buy">Buy</option>
            </select>
          </label>
          <NumberInput
            label="Effective tax assumption"
            value={inputs.effectiveTaxRate}
            suffix="%"
            max={60}
            step={0.5}
            onChange={(value) => updateInput('effectiveTaxRate', value)}
          />
          {inputs.housingMode === 'buy' && (
            <>
              <NumberInput
                label="Down payment"
                value={inputs.downPaymentPercent}
                suffix="%"
                max={100}
                onChange={(value) => updateInput('downPaymentPercent', value)}
              />
              <NumberInput
                label="Mortgage rate"
                value={inputs.mortgageRate}
                suffix="%"
                max={25}
                step={0.05}
                onChange={(value) => updateInput('mortgageRate', value)}
              />
            </>
          )}
          <NumberInput
            label="One-way commute"
            value={inputs.commuteMiles}
            suffix="mi"
            onChange={(value) => updateInput('commuteMiles', value)}
          />
          <NumberInput
            label="Commute days per week"
            value={inputs.commuteDaysPerWeek}
            suffix="days"
            max={7}
            onChange={(value) => updateInput('commuteDaysPerWeek', value)}
          />
          <CurrencyInput
            label="Healthcare per month"
            value={inputs.healthcareMonthly}
            onChange={(value) => updateInput('healthcareMonthly', value)}
          />
          <CurrencyInput
            label="Childcare per month"
            value={inputs.childcareMonthly}
            onChange={(value) => updateInput('childcareMonthly', value)}
          />
          <CurrencyInput
            label="Debt payments per month"
            value={inputs.debtMonthly}
            onChange={(value) => updateInput('debtMonthly', value)}
          />
          <CurrencyInput
            label="Other essentials per month"
            value={inputs.otherMonthly}
            onChange={(value) => updateInput('otherMonthly', value)}
          />
        </div>
        <details className="sim-advanced">
          <summary>Transportation assumptions</summary>
          <div className="sim-form-grid">
            <NumberInput
              label="Vehicle efficiency"
              value={inputs.vehicleMpg}
              suffix="mpg"
              min={1}
              onChange={(value) => updateInput('vehicleMpg', value)}
            />
            <CurrencyInput
              label="Gas price per gallon"
              value={inputs.gasPrice}
              onChange={(value) => updateInput('gasPrice', value)}
            />
          </div>
        </details>
      </section>

      <div className="sim-result-grid" id="sim-results">
        <section className="card sim-budget-card">
          <div className="sim-section-heading">
            <span>
              <Calculator size={19} />
            </span>
            <div>
              <small>MONTHLY OUTCOME</small>
              <h3>Disposable income</h3>
            </div>
          </div>
          <div className="sim-budget-summary">
            <div>
              <span>Gross income</span>
              <strong>
                {money(Math.round(leftResult.grossMonthlyIncome))}
              </strong>
            </div>
            <i>−</i>
            <div>
              <span>Modeled costs</span>
              <strong>{money(Math.round(leftResult.totalMonthlyCosts))}</strong>
            </div>
            <i>=</i>
            <div
              className={
                leftResult.disposableIncome < 0 ? 'negative' : 'positive'
              }
            >
              <span>Remaining</span>
              <strong>{money(Math.round(leftResult.disposableIncome))}</strong>
            </div>
          </div>
          <div className="sim-cost-list">
            {leftResult.costs.map((cost) => (
              <details key={cost.key}>
                <summary>
                  <span>{cost.label}</span>
                  <b>{money(Math.round(cost.value))}</b>
                </summary>
                <p>{cost.explanation}</p>
              </details>
            ))}
          </div>
          <p className="sim-method-note">
            Planning estimate only. Taxes are based on your effective-rate
            input; verify tax, insurance, utility, and property costs before
            deciding.
          </p>
        </section>

        <div className="sim-side-stack">
          <section className="card sim-scores-card">
            <div className="sim-section-heading">
              <span>
                <Target size={19} />
              </span>
              <div>
                <small>EXPLAINABLE RESULT</small>
                <h3>Fit and regret check</h3>
              </div>
            </div>
            <div className="sim-score-grid">
              <SimulatorScore
                label="City fit"
                score={leftResult.fitScore}
                tone="good"
              />
              <SimulatorScore
                label="Regret risk"
                score={leftResult.regretScore}
                tone="warning"
              />
            </div>
            <div className="sim-dimensions">
              {(
                Object.entries(leftResult.dimensions) as [string, number][]
              ).map(([label, score]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${score}%` }} />
                  </div>
                  <b>{Math.round(score)}</b>
                </div>
              ))}
            </div>
            <ul>
              {leftResult.explanations.map((explanation) => (
                <li key={explanation}>{explanation}</li>
              ))}
            </ul>
          </section>

          <section className="card sim-exposure-card">
            <div className="sim-section-heading">
              <span>
                <Home size={19} />
              </span>
              <div>
                <small>TRUE HOUSING COST</small>
                <h3>Total housing exposure</h3>
              </div>
            </div>
            <strong>
              {money(Math.round(leftResult.housingExposure))}
              <small>/month</small>
            </strong>
            <p>
              {leftResult.housingBurdenPercent.toFixed(1)}% of gross income,
              including housing, utilities, transportation, and hazard reserve.
            </p>
          </section>
        </div>
      </div>

      <section className="card sim-dealbreakers" id="sim-rules">
        <div className="sim-section-heading">
          <span>
            <AlertTriangle size={19} />
          </span>
          <div>
            <small>NON-NEGOTIABLES</small>
            <h3>Deal-breaker engine</h3>
          </div>
        </div>
        <div className="sim-rules-grid">
          <CurrencyInput
            label="Maximum housing"
            value={dealBreakers.maximumHousing}
            onChange={(value) => updateRule('maximumHousing', value)}
          />
          <CurrencyInput
            label="Minimum cash remaining"
            value={dealBreakers.minimumDisposable}
            onChange={(value) => updateRule('minimumDisposable', value)}
          />
          <NumberInput
            label="Maximum FEMA risk"
            value={dealBreakers.maximumRisk}
            suffix="/100"
            max={100}
            onChange={(value) => updateRule('maximumRisk', value)}
          />
          <NumberInput
            label="Minimum employment rate"
            value={dealBreakers.minimumEmploymentRate}
            suffix="%"
            max={100}
            step={0.1}
            onChange={(value) => updateRule('minimumEmploymentRate', value)}
          />
        </div>
        <div className="sim-requirements">
          {leftResult.requirements.map((requirement) => (
            <div
              className={requirement.passed ? 'passed' : 'failed'}
              key={requirement.label}
            >
              <span>
                {requirement.passed ? <Check size={16} /> : <X size={16} />}
              </span>
              <div>
                <strong>{requirement.label}</strong>
                <small>{requirement.rule}</small>
              </div>
              <b>{requirement.actual}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="card sim-career-card">
        <div className="sim-section-heading">
          <span>
            <BriefcaseBusiness size={19} />
          </span>
          <div>
            <small>CAREER COMPATIBILITY</small>
            <h3>Does the local economy fit your work?</h3>
          </div>
        </div>
        <div className="sim-career-controls">
          <label className="sim-field">
            <FieldLabel label="Your industry keyword" />
            <input
              type="text"
              value={inputs.desiredIndustry}
              placeholder="Example: technology, health, construction"
              onChange={(event) =>
                updateInput('desiredIndustry', event.target.value)
              }
            />
          </label>
          <label className="sim-check-field">
            <input
              type="checkbox"
              checked={dealBreakers.requireIndustryMatch}
              onChange={(event) =>
                updateRule('requireIndustryMatch', event.target.checked)
              }
            />
            Make an industry match a deal-breaker
          </label>
        </div>
        <div className="sim-career-result">
          <div>
            <span>Employment rate</span>
            <strong>{leftData.employmentRate.toFixed(1)}%</strong>
            <small>Residents in the civilian labor force</small>
          </div>
          <div>
            <span>Median worker earnings</span>
            <strong>{money(Math.round(leftData.medianWorkerEarnings))}</strong>
            <small>Census ACS estimate</small>
          </div>
          <div>
            <span>Selected-field match</span>
            <strong>
              {inputs.desiredIndustry
                ? leftResult.industryMatch.matched
                  ? 'Matched'
                  : 'Not found'
                : 'Choose a field'}
            </strong>
            <small>{leftResult.industryMatch.label}</small>
          </div>
        </div>
      </section>

      <section className="card sim-consensus-card" id="sim-consensus">
        <div className="sim-section-heading">
          <span>
            <HeartHandshake size={19} />
          </span>
          <div>
            <small>HOUSEHOLD CONSENSUS</small>
            <h3>Find the compromise, not just the winner</h3>
          </div>
        </div>
        <div className="sim-consensus-layout">
          <WeightControls
            name="Your priorities"
            value={firstWeights}
            onChange={setFirstWeights}
          />
          <WeightControls
            name="Partner priorities"
            value={secondWeights}
            onChange={setSecondWeights}
          />
          <div className="consensus-result">
            <div>
              <span>{city.name}</span>
              <strong>{leftConsensus.combinedScore}</strong>
              <small>Combined fit · {leftConsensus.alignment}% alignment</small>
            </div>
            {comparisonCity && rightConsensus ? (
              <div>
                <span>{comparisonCity.name}</span>
                <strong>{rightConsensus.combinedScore}</strong>
                <small>
                  Combined fit · {rightConsensus.alignment}% alignment
                </small>
              </div>
            ) : (
              <div className="consensus-city-picker">
                <span>Add a city to compare</span>
                <CitySelect
                  value={null}
                  onChange={setComparisonCity}
                  placeholder="Search another city"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="sim-bottom-grid">
        <section className="card sim-confidence-card">
          <div className="sim-section-heading">
            <span>
              <Database size={19} />
            </span>
            <div>
              <small>DATA CONFIDENCE</small>
              <h3>Know what to trust</h3>
              <p>
                High confidence is good—it means the source is stronger, not
                that the city scored higher.
              </p>
            </div>
          </div>
          <div className="confidence-list">
            {confidence.map((item) => (
              <div key={item.label}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </span>
                <ConfidenceBadge level={item.level} />
              </div>
            ))}
          </div>
        </section>

        <section className="card sim-checklist-card">
          <div className="sim-section-heading">
            <span>
              <ClipboardCheck size={19} />
            </span>
            <div>
              <small>MOVE READINESS</small>
              <h3>
                {completed.length} of {checklistItems.length} verified
              </h3>
            </div>
          </div>
          <div className="checklist-progress">
            <i
              style={{
                width: `${(completed.length / checklistItems.length) * 100}%`,
              }}
            />
          </div>
          <div className="readiness-list">
            {checklistItems.map((item) => (
              <label
                key={item}
                className={completed.includes(item) ? 'complete' : ''}
              >
                <input
                  type="checkbox"
                  checked={completed.includes(item)}
                  onChange={() => toggleChecklist(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <p className="simulator-disclaimer">
        <Users size={14} /> Results are deterministic planning estimates, not
        financial, tax, insurance, employment, or relocation advice. Open each
        cost row to inspect its formula or assumption.
      </p>
    </div>
  )
}

export default LifeSimulatorPage
