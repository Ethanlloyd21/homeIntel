import {
  ArrowDown,
  BadgeDollarSign,
  BriefcaseBusiness,
  Check,
  ExternalLink,
  GraduationCap,
  Home,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import CitySelect from '../components/CitySelect'
import LoadingSpinner from '../components/LoadingSpinner'
import type { City } from '../data/cities'
import { useDemographicsQuery } from '../hooks/useDemographicsQuery'
import { useEmploymentQuery } from '../hooks/useEmploymentQuery'
import { useHousingQuery } from '../hooks/useHousingQuery'
import { useRiskQuery } from '../hooks/useRiskQuery'
import { useComparisonIndicesQuery } from '../hooks/useComparisonIndicesQuery'
import { compact, money } from '../utils/formatters'

type CompareMetric = {
  label: string
  note?: string
  left: number
  right: number
  format: (value: number) => string
  better: 'high' | 'low' | 'neutral'
}

function ComparePicker({
  left,
  right,
  setLeft,
  setRight,
  ready,
}: {
  left: City
  right: City | null
  setLeft: (city: City) => void
  setRight: (city: City) => void
  ready: boolean
}) {
  return (
    <div className="compare-picker card">
      <div>
        <small>CITY A</small>
        <CitySelect
          value={left}
          onChange={setLeft}
          placeholder="Search City A"
        />
      </div>
      <div className="vs">VS</div>
      <div>
        <small>CITY B</small>
        <CitySelect
          value={right}
          onChange={setRight}
          placeholder="Enter City B to compare"
        />
      </div>
      {ready && (
        <a href="#comparison-results">
          See comparison <ArrowDown size={15} />
        </a>
      )}
    </div>
  )
}

function ComparisonSection({
  title,
  eyebrow,
  icon: Icon,
  metrics,
  leftColor,
  rightColor,
  leftName,
  rightName,
}: {
  title: string
  eyebrow: string
  icon: LucideIcon
  metrics: CompareMetric[]
  leftColor: string
  rightColor: string
  leftName: string
  rightName: string
}) {
  return (
    <section className="card compare-section">
      <div className="compare-section-heading">
        <span>
          <Icon size={17} aria-hidden="true" />
        </span>
        <div>
          <small>{eyebrow}</small>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="compare-section-labels" aria-hidden="true">
        <span>Metric</span>
        <span>{leftName}</span>
        <span>{rightName}</span>
      </div>
      {metrics.map((metric) => {
        const leftWins =
          metric.left > 0 &&
          metric.right > 0 &&
          metric.better !== 'neutral' &&
          (metric.better === 'high'
            ? metric.left > metric.right
            : metric.left < metric.right)
        const rightWins =
          metric.left > 0 &&
          metric.right > 0 &&
          metric.better !== 'neutral' &&
          (metric.better === 'high'
            ? metric.right > metric.left
            : metric.right < metric.left)
        const max = Math.max(metric.left, metric.right, 1)
        return (
          <div className="compare-metric" key={metric.label}>
            <div className="compare-metric-topline">
              <span className="compare-metric-name">
                {metric.label}
                {metric.note && <small>{metric.note}</small>}
              </span>
              <strong className={leftWins ? 'winner' : ''}>
                {metric.format(metric.left)}
                {leftWins && <Check size={13} />}
              </strong>
              <strong className={rightWins ? 'winner' : ''}>
                {rightWins && <Check size={13} />}
                {metric.format(metric.right)}
              </strong>
            </div>
            <div className="compare-track-row" aria-hidden="true">
              <span />
              <div className="compare-track">
                <i
                  style={{
                    width: `${(metric.left / max) * 100}%`,
                    background: leftColor,
                  }}
                />
              </div>
              <div className="compare-track">
                <i
                  style={{
                    width: `${(metric.right / max) * 100}%`,
                    background: rightColor,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function ComparePage({
  left,
  right,
  setLeft,
  setRight,
}: {
  left: City
  right: City | null
  setLeft: (city: City) => void
  setRight: (city: City) => void
}) {
  const rightQueryCity = right ?? left
  const leftDemographics = useDemographicsQuery(left, Boolean(right))
  const rightDemographics = useDemographicsQuery(rightQueryCity, Boolean(right))
  const leftHousing = useHousingQuery(left, Boolean(right))
  const rightHousing = useHousingQuery(rightQueryCity, Boolean(right))
  const leftEmployment = useEmploymentQuery(left, Boolean(right))
  const rightEmployment = useEmploymentQuery(rightQueryCity, Boolean(right))
  const leftRisk = useRiskQuery(left, Boolean(right))
  const rightRisk = useRiskQuery(rightQueryCity, Boolean(right))
  const leftIndices = useComparisonIndicesQuery(left, Boolean(right))
  const rightIndices = useComparisonIndicesQuery(rightQueryCity, Boolean(right))

  if (!right) {
    return (
      <div className="compare-page">
        <div className="compare-title">
          <p className="eyebrow">CITY VS CITY</p>
          <h2>Which place fits your next move?</h2>
          <span>
            Keep {left.name} as City A or search for a different starting city,
            then enter City B to begin.
          </span>
        </div>
        <ComparePicker
          left={left}
          right={null}
          setLeft={setLeft}
          setRight={setRight}
          ready={false}
        />
        <section className="compare-empty card">
          <div>
            <Users size={25} />
          </div>
          <h3>Choose a second city to compare</h3>
          <p>
            Results stay empty until you select City B. We will then load
            housing, demographics, employment, and natural-hazard information
            for both places.
          </p>
        </section>
      </div>
    )
  }
  const pending = [
    leftDemographics,
    rightDemographics,
    leftHousing,
    rightHousing,
    leftEmployment,
    rightEmployment,
    leftRisk,
    rightRisk,
    leftIndices,
    rightIndices,
  ].some((query) => query.isPending)

  const ld = leftDemographics.data
  const rd = rightDemographics.data
  const lh = leftHousing.data
  const rh = rightHousing.data
  const le = leftEmployment.data
  const re = rightEmployment.data
  const lr = leftRisk.data
  const rr = rightRisk.data
  const li = leftIndices.data
  const ri = rightIndices.data
  const number = (value: number | undefined, fallback: number) =>
    value ?? fallback
  const percent = (value: number) => `${value.toFixed(1)}%`

  const housingMetrics: CompareMetric[] = [
    {
      label: 'Cost of living index',
      note: '2024 BEA state price level; U.S. average = 100',
      left: li?.costOfLivingIndex ?? 0,
      right: ri?.costOfLivingIndex ?? 0,
      format: (value) => (value ? value.toFixed(1) : 'N/A'),
      better: 'low',
    },
    {
      label: 'Typical home value',
      note: 'Lower may be more affordable',
      left: number(lh?.medianHomeValue, left.home),
      right: number(rh?.medianHomeValue, right.home),
      format: money,
      better: 'low',
    },
    {
      label: 'Typical monthly rent',
      note: 'Zillow ZORI or Census fallback',
      left: number(lh?.medianRent, left.rent),
      right: number(rh?.medianRent, right.rent),
      format: money,
      better: 'low',
    },
    {
      label: 'Owner occupied',
      left: number(lh?.ownerOccupiedPercent, left.owner),
      right: number(rh?.ownerOccupiedPercent, right.owner),
      format: percent,
      better: 'high',
    },
  ]
  const peopleMetrics: CompareMetric[] = [
    {
      label: 'Population',
      left: number(ld?.estimatedCurrentPopulation, left.population),
      right: number(rd?.estimatedCurrentPopulation, right.population),
      format: compact,
      better: 'neutral',
    },
    {
      label: 'Median household income',
      left: number(ld?.medianHouseholdIncome, left.income),
      right: number(rd?.medianHouseholdIncome, right.income),
      format: money,
      better: 'high',
    },
    {
      label: 'College educated',
      left: number(ld?.collegeEducatedPercent, left.college),
      right: number(rd?.collegeEducatedPercent, right.college),
      format: percent,
      better: 'high',
    },
    {
      label: 'Median age',
      note: 'Years',
      left: number(ld?.medianAge, left.age),
      right: number(rd?.medianAge, right.age),
      format: (value) => value.toFixed(1),
      better: 'neutral',
    },
    {
      label: 'Average household size',
      note: 'People per household',
      left: number(ld?.averageHouseholdSize, 0),
      right: number(rd?.averageHouseholdSize, 0),
      format: (value) => value.toFixed(2),
      better: 'neutral',
    },
    {
      label: 'Foreign-born residents',
      left: number(ld?.foreignBornPercent, 0),
      right: number(rd?.foreignBornPercent, 0),
      format: percent,
      better: 'neutral',
    },
  ]
  const opportunityMetrics: CompareMetric[] = [
    {
      label: 'Employment rate',
      left: number(le?.employmentRate, left.employed),
      right: number(re?.employmentRate, right.employed),
      format: percent,
      better: 'high',
    },
    {
      label: 'Median worker earnings',
      left: number(le?.medianWorkerEarnings, left.income),
      right: number(re?.medianWorkerEarnings, right.income),
      format: money,
      better: 'high',
    },
    {
      label: 'Civilian labor force',
      left: number(le?.laborForce, 0),
      right: number(re?.laborForce, 0),
      format: compact,
      better: 'neutral',
    },
    {
      label: 'Population growth',
      left: number(ld?.estimatedCurrentGrowthPercent, left.growth),
      right: number(rd?.estimatedCurrentGrowthPercent, right.growth),
      format: percent,
      better: 'high',
    },
  ]
  const riskMetrics: CompareMetric[] = [
    {
      label: 'Violent crime index',
      note: '2023 FBI UCR state rate; U.S. average = 100',
      left: li?.violentCrimeIndex ?? 0,
      right: ri?.violentCrimeIndex ?? 0,
      format: (value) => (value ? Math.round(value).toString() : 'N/A'),
      better: 'low',
    },
    {
      label: 'Natural hazard loss potential',
      note: 'FEMA Expected Annual Loss; lower is better',
      left: number(lr?.score, left.risk),
      right: number(rr?.score, right.risk),
      format: (value) => `${Math.round(value)} / 100`,
      better: 'low',
    },
    {
      label: 'State risk percentile',
      note: 'Relative to locations in the same state',
      left: number(lr?.statePercentile, 0),
      right: number(rr?.statePercentile, 0),
      format: (value) => `${Math.round(value)}th`,
      better: 'low',
    },
    {
      label: 'Community resilience',
      left: number(lr?.resilienceScore ?? undefined, 0),
      right: number(rr?.resilienceScore ?? undefined, 0),
      format: (value) => (value ? `${Math.round(value)} / 100` : 'N/A'),
      better: 'high',
    },
  ]

  const allMetrics = [
    ...housingMetrics,
    ...peopleMetrics.slice(1),
    ...opportunityMetrics,
    ...riskMetrics,
  ]
  const leftWins = allMetrics.filter(
    (metric) =>
      metric.better !== 'neutral' &&
      (metric.better === 'high'
        ? metric.left > metric.right
        : metric.left < metric.right),
  ).length
  const rightWins = allMetrics.filter(
    (metric) =>
      metric.better !== 'neutral' &&
      (metric.better === 'high'
        ? metric.right > metric.left
        : metric.right < metric.left),
  ).length
  const leader =
    leftWins === rightWins ? null : leftWins > rightWins ? left : right

  return (
    <div className="compare-page">
      <div className="compare-title">
        <p className="eyebrow">CITY VS CITY</p>
        <h2>Which place fits your next move?</h2>
        <span>
          Compare housing, people, opportunity, and natural-hazard risk using
          the latest available public data.
        </span>
      </div>

      <ComparePicker
        left={left}
        right={right}
        setLeft={setLeft}
        setRight={setRight}
        ready
      />

      <section className="compare-verdict card">
        <div className="verdict-icon">
          <Sparkles size={22} />
        </div>
        <div>
          <small>AT A GLANCE</small>
          <h3>
            {leader
              ? `${leader.name} leads on more measurable indicators`
              : 'These cities are closely matched'}
          </h3>
          <p>
            {left.name} leads in {leftWins} categories; {right.name} leads in{' '}
            {rightWins}. A check marks the stronger raw value, not a universal
            recommendation—your priorities should decide the winner.
          </p>
        </div>
        {pending && (
          <LoadingSpinner size={30} label="Refreshing comparison data" />
        )}
      </section>

      <div className="compare-city-header" id="comparison-results">
        <div>
          <span style={{ background: left.color }}>{left.short}</span>
          <div>
            <strong>{left.name}</strong>
            <small>{left.state}</small>
          </div>
        </div>
        <p>HEAD-TO-HEAD</p>
        <div>
          <div>
            <strong>{right.name}</strong>
            <small>{right.state}</small>
          </div>
          <span style={{ background: right.color }}>{right.short}</span>
        </div>
      </div>

      <div className="compare-sections">
        <ComparisonSection
          title="Housing affordability"
          eyebrow="HOUSING"
          icon={Home}
          metrics={housingMetrics}
          leftColor={left.color}
          rightColor={right.color}
          leftName={left.name}
          rightName={right.name}
        />
        <ComparisonSection
          title="People and households"
          eyebrow="DEMOGRAPHICS"
          icon={Users}
          metrics={peopleMetrics}
          leftColor={left.color}
          rightColor={right.color}
          leftName={left.name}
          rightName={right.name}
        />
        <ComparisonSection
          title="Jobs and momentum"
          eyebrow="OPPORTUNITY"
          icon={BriefcaseBusiness}
          metrics={opportunityMetrics}
          leftColor={left.color}
          rightColor={right.color}
          leftName={left.name}
          rightName={right.name}
        />
        <ComparisonSection
          title="Hazard and resilience"
          eyebrow="FEMA RISK"
          icon={ShieldCheck}
          metrics={riskMetrics}
          leftColor={left.color}
          rightColor={right.color}
          leftName={left.name}
          rightName={right.name}
        />
      </div>

      <section className="compare-sources card">
        <div>
          <BadgeDollarSign size={18} />
          <div>
            <strong>Transparent, decision-ready data</strong>
            <p>
              Housing market values use Zillow Research when available.
              Demographics and employment use Census ACS estimates.
              Natural-hazard scores use FEMA National Risk Index data.
            </p>
          </div>
        </div>
        <div className="compare-source-links">
          <a
            href="https://www.zillow.com/research/data/"
            target="_blank"
            rel="noreferrer"
          >
            Zillow Research <ExternalLink size={12} />
          </a>
          <a
            href="https://www.census.gov/programs-surveys/acs"
            target="_blank"
            rel="noreferrer"
          >
            Census ACS <ExternalLink size={12} />
          </a>
          <a
            href="https://hazards.fema.gov/nri/"
            target="_blank"
            rel="noreferrer"
          >
            FEMA NRI <ExternalLink size={12} />
          </a>
          <a
            href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area"
            target="_blank"
            rel="noreferrer"
          >
            BEA price levels <ExternalLink size={12} />
          </a>
          <a
            href="https://cde.ucr.cjis.gov/LATEST/webapp/"
            target="_blank"
            rel="noreferrer"
          >
            FBI Crime Data <ExternalLink size={12} />
          </a>
        </div>
      </section>
      <section className="compare-faq card">
        <div className="section-heading">
          <div>
            <small>HOW TO READ THE RESULTS</small>
            <h3>Common comparison questions</h3>
          </div>
        </div>
        <details>
          <summary>Which city has more affordable housing?</summary>
          <p>
            {housingMetrics[0].left < housingMetrics[0].right
              ? left.name
              : right.name}{' '}
            currently has the lower typical home value. Compare rent and
            ownership rates too—a lower purchase value does not guarantee lower
            monthly living costs.
          </p>
        </details>
        <details>
          <summary>Which city has the stronger income picture?</summary>
          <p>
            {peopleMetrics[1].left > peopleMetrics[1].right
              ? left.name
              : right.name}{' '}
            has the higher Census median household income. This is a citywide
            median and does not account for your occupation, household size,
            taxes, or neighborhood.
          </p>
        </details>
        <details>
          <summary>How should I interpret the FEMA risk score?</summary>
          <p>
            Lower Expected Annual Loss potential is preferable. It represents
            modeled natural-hazard loss, not the probability that a particular
            home will experience a disaster. Review property-level flood and
            insurance information before moving.
          </p>
        </details>
      </section>
      <p className="compare-disclaimer">
        <GraduationCap size={13} /> Indicators are city-level research aids, not
        financial, insurance, or relocation advice.
      </p>
    </div>
  )
}
