import { useState } from 'react'
import type { DemographicsData } from 'services/demographics'
import { fmt } from 'utils/formatters'
import AnimatedValue from 'components/AnimatedValue'

const raceColors = [
  '#5968e8',
  '#e7688a',
  '#e5a43a',
  '#27a87b',
  '#8b6cff',
  '#7f8c86',
]
const comparisonColors = ['#5968e8', '#27a87b', '#e5a43a']

const PeopleProfileChart = ({
  demographics,
  color,
}: {
  demographics: DemographicsData
  color: string
}) => {
  const [activeRace, setActiveRace] = useState(
    demographics.raceDistribution[0]?.label ?? '',
  )
  const activeRaceItem =
    demographics.raceDistribution.find(({ label }) => label === activeRace) ??
    demographics.raceDistribution[0]
  const maxPopulation = Math.max(
    ...demographics.populationSeries.map(({ population }) => population),
  )
  const minPopulation = Math.min(
    ...demographics.populationSeries.map(({ population }) => population),
  )
  const populationRange = Math.max(maxPopulation - minPopulation, 1)
  const barHeight = (value: number) =>
    30 + ((value - minPopulation) / populationRange) * 70
  const firstPopulation = demographics.populationSeries[0]?.population ?? 0
  const populationDifference =
    demographics.estimatedCurrentPopulation - firstPopulation
  const seriesGrowthPercent =
    firstPopulation > 0 ? (populationDifference / firstPopulation) * 100 : 0

  return (
    <section className="card wide-chart people-profile-chart">
      <div className="section-heading">
        <div>
          <small>CENSUS PEOPLE PROFILE</small>
          <h3>Recent population and community makeup</h3>
        </div>
        <span className="people-period">
          {demographics.populationSeries[0]?.year}-{demographics.estimateYear}
        </span>
      </div>
      <div className="people-chart-layout">
        <div className="population-bars">
          {demographics.populationSeries.map((item) => (
            <div className="population-bar-item" key={item.year}>
              <strong>
                <AnimatedValue value={fmt.format(item.population)} />
              </strong>
              <div className="population-bar-track">
                <i
                  className="population-bar-fill"
                  style={{
                    height: `${barHeight(item.population)}%`,
                    background: item.calculated ? '#aebbb5' : color,
                  }}
                />
              </div>
              <span>
                {item.year}
                {item.calculated ? ' calc.' : ''}
              </span>
            </div>
          ))}
        </div>
        <div className="people-highlight-grid">
          <div>
            <span>Population change</span>
            <strong>
              <AnimatedValue
                value={`${seriesGrowthPercent >= 0 ? '+' : ''}${seriesGrowthPercent.toFixed(1)}%`}
              />
            </strong>
            <small>
              {populationDifference >= 0 ? '+' : ''}
              {fmt.format(populationDifference)} people since{' '}
              {demographics.populationSeries[0]?.year}
            </small>
          </div>
          <div>
            <span>Median age</span>
            <strong>
              <AnimatedValue value={demographics.medianAge.toFixed(1)} />
            </strong>
            <small>years old</small>
          </div>
          <div>
            <span>Household size</span>
            <strong>
              <AnimatedValue
                value={demographics.averageHouseholdSize.toFixed(2)}
              />
            </strong>
            <small>people per occupied household</small>
          </div>
          <div>
            <span>Foreign born</span>
            <strong>
              <AnimatedValue
                value={`${demographics.foreignBornPercent.toFixed(1)}%`}
              />
            </strong>
            <small>share of the city population</small>
          </div>
        </div>
      </div>
      {demographics.raceDistribution.length > 0 && (
        <section className="race-profile-section">
          <div className="race-profile-heading">
            <div>
              <small>RACE AND ETHNICITY</small>
              <h4>Community composition</h4>
            </div>
            <span>2020-2024 ACS estimate</span>
          </div>
          <div className="race-profile-content">
            <div className="race-pie-wrap">
              <svg
                className="race-pie"
                viewBox="0 0 42 42"
                role="img"
                aria-label="Race and ethnicity distribution"
              >
                <circle
                  className="race-pie-background"
                  cx="21"
                  cy="21"
                  r="15.9155"
                />
                {demographics.raceDistribution.map((item, index) => {
                  const offset = demographics.raceDistribution
                    .slice(0, index)
                    .reduce((sum, entry) => sum + entry.percent, 0)
                  return (
                    <circle
                      className={`race-pie-segment${activeRace === item.label ? ' active' : ''}${activeRace && activeRace !== item.label ? ' muted' : ''}`}
                      cx="21"
                      cy="21"
                      r="15.9155"
                      fill="transparent"
                      stroke={raceColors[index % raceColors.length]}
                      strokeDasharray={`${item.percent} ${100 - item.percent}`}
                      strokeDashoffset={-offset}
                      key={item.label}
                      tabIndex={0}
                      aria-label={`${item.label}: ${item.percent.toFixed(1)}%, ${fmt.format(item.population)} people`}
                      onMouseEnter={() => setActiveRace(item.label)}
                      onFocus={() => setActiveRace(item.label)}
                    >
                      <title>
                        {item.label}: {item.percent.toFixed(1)}% (
                        {fmt.format(item.population)} people)
                      </title>
                    </circle>
                  )
                })}
              </svg>
              <div className="race-pie-center">
                <strong>{activeRaceItem?.percent.toFixed(1) ?? '0.0'}%</strong>
                <span>{activeRaceItem?.label ?? 'No race data'}</span>
              </div>
            </div>
            <div className="race-legend">
              {demographics.raceDistribution.map((item, index) => (
                <button
                  type="button"
                  className={`${activeRace === item.label ? 'active' : ''}${activeRace && activeRace !== item.label ? ' muted' : ''}`}
                  key={item.label}
                  onMouseEnter={() => setActiveRace(item.label)}
                  onFocus={() => setActiveRace(item.label)}
                  onClick={() => setActiveRace(item.label)}
                  aria-pressed={activeRace === item.label}
                >
                  <i
                    style={{
                      background: raceColors[index % raceColors.length],
                    }}
                  />
                  <span>{item.label}</span>
                  <strong>{item.percent.toFixed(1)}%</strong>
                  <small>{fmt.format(item.population)}</small>
                </button>
              ))}
            </div>
          </div>
          <p>
            Source: U.S. Census Bureau 2020-2024 ACS five-year table B03002,
            Hispanic or Latino Origin by Race. Hispanic or Latino is shown as a
            separate ethnicity category; the race categories shown are
            non-Hispanic to prevent double counting. Estimates omit margins of
            error.
          </p>
        </section>
      )}
      {demographics.educationHouseholdComparison.length === 3 && (
        <section className="education-household-section">
          <div className="race-profile-heading">
            <div>
              <small>EDUCATION &amp; HOUSEHOLD</small>
              <h4>City, state, and national comparison</h4>
            </div>
            <span>Adults age 25+ · 2020-2024 ACS</span>
          </div>
          <div className="comparison-key">
            {demographics.educationHouseholdComparison.map((item, index) => (
              <span key={item.geography}>
                <i style={{ background: comparisonColors[index] }} />
                {item.geography}
              </span>
            ))}
          </div>
          <div className="education-comparison-grid">
            {[
              { label: "Bachelor's degree", key: 'bachelorsPercent' as const },
              {
                label: 'Graduate or professional degree',
                key: 'graduatePercent' as const,
              },
              {
                label: "Bachelor's degree or higher",
                key: 'bachelorsOrHigherPercent' as const,
              },
            ].map((metric) => (
              <article key={metric.key}>
                <h5>{metric.label}</h5>
                {demographics.educationHouseholdComparison.map(
                  (item, index) => (
                    <div className="comparison-bar-row" key={item.geography}>
                      <span>{item.geography}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.min(item[metric.key], 100)}%`,
                            background: comparisonColors[index],
                          }}
                        />
                      </div>
                      <strong>{item[metric.key].toFixed(1)}%</strong>
                    </div>
                  ),
                )}
              </article>
            ))}
            <article className="household-comparison-card">
              <h5>Average household size</h5>
              {demographics.educationHouseholdComparison.map((item, index) => (
                <div className="comparison-bar-row" key={item.geography}>
                  <span>{item.geography}</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.min((item.averageHouseholdSize / 5) * 100, 100)}%`,
                        background: comparisonColors[index],
                      }}
                    />
                  </div>
                  <strong>{item.averageHouseholdSize.toFixed(2)}</strong>
                </div>
              ))}
              <small>People per occupied household</small>
            </article>
          </div>
          <p>
            Source: U.S. Census Bureau 2020-2024 ACS five-year tables B15003 and
            B25010. Education percentages use the population age 25 and older.
            Graduate includes master's, professional, and doctoral degrees.
            Estimates omit margins of error.
          </p>
        </section>
      )}
      <p className="people-chart-note">
        Official Census Population Estimates are shown for 2023, 2024, and 2025.
        The 2022 backcast and {demographics.estimateYear} value come from a
        least-squares linear trend fitted to those three official estimates;
        they are HomeIntel calculations, not official Census estimates.
      </p>
    </section>
  )
}

export default PeopleProfileChart
