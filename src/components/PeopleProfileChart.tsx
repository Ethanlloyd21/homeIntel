import type { DemographicsData } from '../services/demographics'
import { fmt } from '../utils/formatters'

export default function PeopleProfileChart({
  demographics,
  color,
}: {
  demographics: DemographicsData
  color: string
}) {
  const maxPopulation = Math.max(
    demographics.previousPopulation,
    demographics.estimatedCurrentPopulation,
  )
  const barHeight = (value: number) =>
    maxPopulation > 0 ? Math.max((value / maxPopulation) * 100, 8) : 8
  const populationDifference =
    demographics.estimatedCurrentPopulation - demographics.previousPopulation

  return (
    <section className="card wide-chart people-profile-chart">
      <div className="section-heading">
        <div>
          <small>CENSUS PEOPLE PROFILE</small>
          <h3>Population trend and community makeup</h3>
        </div>
        <span className="people-period">
          2019–{demographics.estimateYear} calculated
        </span>
      </div>
      <div className="people-chart-layout">
        <div className="population-bars">
          <div className="population-bar-item">
            <strong>{fmt.format(demographics.previousPopulation)}</strong>
            <div className="population-bar-track">
              <i
                style={{
                  height: `${barHeight(demographics.previousPopulation)}%`,
                  background: '#aebbb5',
                }}
              />
            </div>
            <span>2019</span>
          </div>
          <div className="population-bar-item">
            <strong>
              {fmt.format(demographics.estimatedCurrentPopulation)}
            </strong>
            <div className="population-bar-track">
              <i
                style={{
                  height: `${barHeight(demographics.estimatedCurrentPopulation)}%`,
                  background: color,
                }}
              />
            </div>
            <span>{demographics.estimateYear}</span>
          </div>
        </div>
        <div className="people-highlight-grid">
          <div>
            <span>Population change</span>
            <strong>
              {demographics.estimatedCurrentGrowthPercent >= 0 ? '+' : ''}
              {demographics.estimatedCurrentGrowthPercent.toFixed(1)}%
            </strong>
            <small>
              {populationDifference >= 0 ? '+' : ''}
              {fmt.format(populationDifference)} people
            </small>
          </div>
          <div>
            <span>Median age</span>
            <strong>{demographics.medianAge.toFixed(1)}</strong>
          </div>
          <div>
            <span>Household size</span>
            <strong>{demographics.averageHouseholdSize.toFixed(2)}</strong>
          </div>
          <div>
            <span>Foreign born</span>
            <strong>{demographics.foreignBornPercent.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
      <p className="people-chart-note">
        The {demographics.estimateYear} value applies the official 2024–2025
        Census city growth rate to 2025 once more. The resulting value is a
        calculation, not an official Census estimate.
      </p>
    </section>
  )
}
