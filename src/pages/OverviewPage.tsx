import {
  ArrowRight,
  GraduationCap,
  Home,
  MapPin,
  Compass,
  Calculator,
  ShieldCheck,
  Sun,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import CityMap from 'components/CityMap'
import SourceChip from 'components/SourceChip'
import MetricCard from 'components/MetricCard'
import LoadingSpinner from 'components/LoadingSpinner'
import ScoreRing from 'components/ScoreRing'
import WeatherCard from 'components/WeatherCard'
import type { City } from 'data/cities'
import { useDemographicsQuery } from 'hooks/useDemographicsQuery'
import { useEmploymentQuery } from 'hooks/useEmploymentQuery'
import { useHousingQuery } from 'hooks/useHousingQuery'
import { useRiskQuery } from 'hooks/useRiskQuery'
import { compact, money } from 'utils/formatters'

type OverviewPageProps = {
  city: City
  setView: (view: string) => void
}

const OverviewPage = ({ city, setView }: OverviewPageProps) => {
  const demographicsQuery = useDemographicsQuery(city, true, false)
  const demographics = demographicsQuery.data
  const employmentQuery = useEmploymentQuery(city, true, false)
  const employment = employmentQuery.data
  const housingQuery = useHousingQuery(city)
  const housing = housingQuery.data
  const riskQuery = useRiskQuery(city)
  const risk = riskQuery.data
  const pendingValue = demographicsQuery.isPending ? (
    <LoadingSpinner label="Loading Census demographics" />
  ) : (
    'N/A'
  )
  const housingPendingValue = housingQuery.isPending ? (
    <LoadingSpinner label="Loading housing indicators" />
  ) : (
    'N/A'
  )
  const historyChange = (values: { value: number }[]) => {
    if (values.length < 2 || values[0].value === 0) return null
    return ((values.at(-1)!.value - values[0].value) / values[0].value) * 100
  }
  const homeValueChange = housing
    ? historyChange(housing.homeValueHistory)
    : null
  const rentChange = housing ? historyChange(housing.rentHistory) : null
  const trendLabel = (value: number | null) =>
    value === null ? 'N/A' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

  const historyPeriod = (values: { date: string }[] | undefined) => {
    if (!values || values.length < 2) return 'Historical change unavailable'
    const format = (date: string) =>
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    return `${format(values[0].date)} to ${format(values.at(-1)!.date)}`
  }
  const exploreRoutes = [
    {
      view: 'Housing',
      icon: Home,
      title: 'Find your price range',
      description: 'Explore home values, rent, and the local housing market.',
      label: 'Explore housing',
    },
    {
      view: 'DayInLife',
      icon: Sun,
      title: 'Picture an ordinary day',
      description: 'See how the seasons and your routine could fit together.',
      label: 'Explore daily life',
    },
    {
      view: 'Neighborhoods',
      icon: Compass,
      title: 'Get closer to the street',
      description: 'Check commute routes, schools, and nearby essentials.',
      label: 'Explore neighborhoods',
    },
  ]

  return (
    <div className="overview-page">
      <section className="overview-hero" aria-labelledby="overview-title">
        <div className="overview-hero-copy">
          <p className="eyebrow">
            <MapPin size={14} aria-hidden="true" /> {city.name}, {city.state}
          </p>
          <h2 id="overview-title">
            A place to live.
            <br />
            <span>A life to imagine.</span>
          </h2>
          <p className="overview-hero-description">
            Get to know {city.name} beyond the address. Explore what it costs,
            how it feels, and what to consider before your next move.
          </p>
          <div className="overview-hero-actions">
            <button
              type="button"
              className="overview-primary-action"
              onClick={() => setView('Simulator')}
            >
              <Calculator size={17} aria-hidden="true" /> Build my life here{' '}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="overview-secondary-action"
              onClick={() => setView('Compare')}
            >
              Compare cities <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="overview-topics">
            <span>Housing & costs</span>
            <span>People & work</span>
            <span>Everyday life</span>
          </div>
        </div>
        <div className="overview-weather">
          <WeatherCard
            city={city}
            onViewEnvironment={() => setView('Environment')}
          />
          <p className="overview-weather-caption">
            A moment in {city.name}. Explore Environment for the bigger seasonal
            picture.
          </p>
        </div>
      </section>

      <div className="section-title overview-section-title">
        <div>
          <p className="eyebrow">YOUR CITY, IN CONTEXT</p>
          <h2>Start with the essentials</h2>
        </div>
        <p>A sense of the place and the people who call it home.</p>
      </div>
      <div className="overview-grid">
        <CityMap city={city} />
        <div className="snapshot card">
          <div className="section-heading">
            <div>
              <small>CITY SNAPSHOT</small>
              <h3>{city.name} at a glance</h3>
            </div>
            <SourceChip
              source="Census ACS demographics"
              detail="Household income, age, and employment are survey estimates. Population may include a more recent estimate; see the note below."
              level={
                demographicsQuery.isPending
                  ? 'Loading'
                  : demographics
                    ? undefined
                    : 'Unavailable'
              }
            />
          </div>
          <div className="snapshot-grid">
            <div>
              <span>Population</span>
              <strong>
                {demographics
                  ? compact(demographics.estimatedCurrentPopulation)
                  : city.population
                    ? compact(city.population)
                    : pendingValue}
              </strong>
              <small>
                {demographics
                  ? demographics.currentPopulationNote
                  : 'Census population estimate'}
              </small>
            </div>
            <div>
              <span>Median income</span>
              <strong>
                {demographics
                  ? money(demographics.medianHouseholdIncome)
                  : pendingValue}
              </strong>
              <small>per household</small>
            </div>
            <div>
              <span>Median age</span>
              <strong>
                {demographics
                  ? demographics.medianAge.toFixed(1)
                  : pendingValue}
              </strong>
              <small>years old</small>
            </div>
            <div>
              <span>Employed</span>
              <strong>
                {demographics
                  ? `${demographics.employmentRate.toFixed(1)}%`
                  : pendingValue}
              </strong>
              <small>civilian workforce</small>
            </div>
          </div>
          <button className="deep-dive" onClick={() => setView('People')}>
            View demographic deep dive <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="section-title">
        <div>
          <p className="eyebrow">KEY INDICATORS</p>
          <h2>What stands out</h2>
        </div>
        <button onClick={() => setView('Housing')}>
          Explore housing <ArrowRight size={15} />
        </button>
      </div>
      <div className="metrics">
        <MetricCard
          label="Typical home value"
          value={housing ? money(housing.medianHomeValue) : housingPendingValue}
          note={historyPeriod(housing?.homeValueHistory)}
          source={housing?.homeValueNote}
          trend={
            homeValueChange === null ? undefined : trendLabel(homeValueChange)
          }
          icon={Home}
          color="#d65e45"
        />
        <MetricCard
          label="Typical market rent"
          value={housing ? money(housing.medianRent) : housingPendingValue}
          note={historyPeriod(housing?.rentHistory)}
          source={housing?.rentNote}
          trend={rentChange === null ? undefined : trendLabel(rentChange)}
          icon={WalletCards}
          color="#be8a42"
        />
        <MetricCard
          label="Population growth"
          value={
            demographics
              ? `${demographics.estimatedCurrentGrowthPercent.toFixed(1)}%`
              : pendingValue
          }
          note={`${demographics?.populationGrowthStartYear ?? 'Recent'} to ${demographics?.estimateYear ?? 'current year'}`}
          trend={
            demographics
              ? trendLabel(demographics.estimatedCurrentGrowthPercent)
              : undefined
          }
          icon={TrendingUp}
          color="#2e7da1"
        />
        <MetricCard
          label="College educated"
          value={
            demographics
              ? `${demographics.collegeEducatedPercent.toFixed(1)}%`
              : pendingValue
          }
          note="Bachelor's degree or higher"
          source="Census ACS 2020-2024"
          icon={GraduationCap}
          color="#516a82"
        />
      </div>

      <div className="detail-grid">
        <section className="card risk-panel">
          <div className="section-heading">
            <div>
              <small>FEMA LOSS PROFILE</small>
              <h3>Natural hazard loss potential</h3>
            </div>
            <button onClick={() => setView('Risk')}>
              Explore risk <ArrowRight size={14} />
            </button>
          </div>
          <div className="risk-body">
            {riskQuery.isPending ? (
              <LoadingSpinner size={36} label="Loading FEMA risk profile" />
            ) : risk ? (
              <>
                <ScoreRing score={risk.score} color={city.color} />
                <div className="risk-list">
                  {risk.hazards.slice(0, 4).map((hazard) => (
                    <div key={hazard.label}>
                      <span>
                        <i className={hazard.tone} />
                        {hazard.label}
                      </span>
                      <div>
                        <i
                          className="progress-fill-enter"
                          style={{ width: `${hazard.score}%` }}
                        />
                      </div>
                      <b>{hazard.score}</b>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>{riskQuery.error?.message ?? 'Risk data is unavailable.'}</p>
            )}
          </div>
          <p className="risk-note">
            <SourceChip
              source="FEMA Expected Annual Loss score"
              detail="A relative score from 0 to 100; higher scores indicate greater expected annual loss. This is area-level context, not a property-specific assessment."
            />{' '}
            FEMA Expected Annual Loss score (0–100)
            {risk
              ? ` · ${risk.county} County, Census tract ${risk.tract} · ${risk.version}`
              : ''}
          </p>
        </section>

        <section className="card industries">
          <div className="section-heading">
            <div>
              <small>EMPLOYMENT</small>
              <h3>Economic engine</h3>
            </div>
            <button onClick={() => setView('Employment')}>
              Full profile <ArrowRight size={14} />
            </button>
          </div>
          <div className="industry-chart">
            {employmentQuery.isPending ? (
              <LoadingSpinner size={30} label="Loading employment data" />
            ) : employment ? (
              employment.industries.slice(0, 3).map((industry, index) => (
                <div key={industry.name}>
                  <span>{industry.name}</span>
                  <div>
                    <i
                      className="progress-fill-enter"
                      style={{
                        width: `${industry.percent}%`,
                        background:
                          index === 0
                            ? city.color
                            : index === 1
                              ? '#e0a85e'
                              : '#81a0ae',
                      }}
                    />
                  </div>
                  <b>{industry.percent.toFixed(1)}%</b>
                </div>
              ))
            ) : (
              <p>
                {employmentQuery.error?.message ??
                  'Employment data unavailable.'}
              </p>
            )}
          </div>
          <div className="wage-callout">
            <div>
              <Sparkles size={16} />
              <span>Median worker earnings</span>
            </div>
            <strong>
              {employment ? money(employment.medianWorkerEarnings) : 'N/A'}
            </strong>
          </div>
        </section>
      </div>
      <section
        className="overview-explore"
        aria-labelledby="overview-explore-title"
      >
        <div className="section-title overview-section-title">
          <div>
            <p className="eyebrow">MAKE IT PERSONAL</p>
            <h2 id="overview-explore-title">
              What matters in your next chapter?
            </h2>
          </div>
        </div>
        <div className="overview-route-grid">
          {exploreRoutes.map(
            ({ view, icon: Icon, title, description, label }, index) => (
              <button
                type="button"
                className="card overview-route-card"
                key={view}
                onClick={() => setView(view)}
              >
                <span className="overview-route-top">
                  <span className="overview-route-icon">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <span className="overview-route-number">0{index + 1}</span>
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="overview-route-link">
                  {label}
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </button>
            ),
          )}
        </div>
      </section>
      <section className="card overview-next-step">
        <span className="overview-route-icon">
          <ShieldCheck size={24} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">FROM RESEARCH TO A DECISION</p>
          <h3>Bring the whole picture together.</h3>
          <p>
            Your decision brief brings costs, trade-offs, and data confidence
            into one place.
          </p>
        </div>
        <button
          type="button"
          className="overview-secondary-action"
          onClick={() => setView('Brief')}
        >
          Open decision brief <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </div>
  )
}

export default OverviewPage
