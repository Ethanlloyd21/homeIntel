import {
  ArrowRight,
  Check,
  GraduationCap,
  Home,
  Info,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import CityMap from 'components/CityMap'
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
  const demographicsQuery = useDemographicsQuery(city)
  const demographics = demographicsQuery.data
  const employmentQuery = useEmploymentQuery(city)
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

  return (
    <>
      <div className="hero-row">
        <div className="intro">
          <p>Explore a location</p>
          <h2>
            See the whole picture,
            <br />
            before you make a move.
          </h2>
          <span>
            Decision-grade housing, people, employment, risk and environment
            insights—together in one place.
          </span>
        </div>
        <div className="overview-weather">
          <WeatherCard
            city={city}
            onViewEnvironment={() => setView('Environment')}
          />
        </div>
      </div>

      <div className="overview-grid">
        <CityMap city={city} />
        <div className="snapshot card">
          <div className="section-heading">
            <div>
              <small>CITY SNAPSHOT</small>
              <h3>{city.name} at a glance</h3>
            </div>
            <span className="quality">
              <Check size={12} /> Census ACS
            </span>
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
          View all metrics <ArrowRight size={15} />
        </button>
      </div>
      <div className="metrics">
        <MetricCard
          label="Typical home value"
          value={housing ? money(housing.medianHomeValue) : housingPendingValue}
          note="since Jun 2023"
          trend={trendLabel(homeValueChange)}
          icon={Home}
          color="#d65e45"
        />
        <MetricCard
          label="Typical market rent"
          value={housing ? money(housing.medianRent) : housingPendingValue}
          note="since Jun 2023"
          trend={trendLabel(rentChange)}
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
          note={`2019 to ${demographics?.estimateYear ?? 'current year'}`}
          trend={
            demographics
              ? trendLabel(demographics.estimatedCurrentGrowthPercent)
              : 'N/A'
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
            <Info size={14} /> FEMA Expected Annual Loss score (0–100)
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
    </>
  )
}

export default OverviewPage
