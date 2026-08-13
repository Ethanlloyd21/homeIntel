import { useState } from 'react'
import type { EmploymentData } from '../services/employment'
import { fmt } from '../utils/formatters'
import type { CurrentEconomyData } from '../services/currentEconomy'
import LoadingSpinner from './LoadingSpinner'

export default function EconomicGrowthChart({
  employment,
  current,
  isCurrentLoading,
}: {
  employment: EmploymentData
  current?: CurrentEconomyData
  isCurrentLoading: boolean
}) {
  const historicalGrowth = employment.annualGrowth.filter(
    (item): item is typeof item & { changePercent: number } =>
      item.changePercent !== null,
  )
  const lausGrowth = (current?.laus?.annualEmployment ?? []).filter(
    (item): item is typeof item & { changePercent: number } =>
      item.changePercent !== null,
  )
  const reportedGrowth = lausGrowth.length > 0 ? lausGrowth : historicalGrowth
  const growth = reportedGrowth.map((item) => ({
    ...item,
    monthsReported:
      'monthsReported' in item && typeof item.monthsReported === 'number'
        ? item.monthsReported
        : 12,
    estimated: false,
  }))
  const projectionRate =
    current?.qcew?.employmentGrowthPercent ?? growth.at(-1)?.changePercent ?? 0
  const currentYear = new Date().getFullYear()
  while (
    growth.length > 0 &&
    (growth.at(-1)?.year ?? currentYear) < currentYear
  ) {
    const previous = growth.at(-1)!
    growth.push({
      year: previous.year + 1,
      employed: Math.round(previous.employed * (1 + projectionRate / 100)),
      changePercent: projectionRate,
      monthsReported: 0,
      estimated: true,
    })
  }
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const activeIndex = Math.max(
    selectedYear === null
      ? growth.length - 1
      : growth.findIndex((item) => item.year === selectedYear),
    0,
  )
  const active = growth[activeIndex]
  const maxChange = Math.max(
    ...growth.map((item) => Math.abs(item.changePercent)),
    1,
  )

  return (
    <section className="card economic-growth-chart">
      <div className="section-heading">
        <div>
          <small>ANNUAL ECONOMIC MOMENTUM</small>
          <h3>Employment growth by year</h3>
        </div>
        {active && (
          <div className="growth-active-value">
            <strong>
              {active.changePercent >= 0 ? '+' : ''}
              {active.changePercent.toFixed(1)}%
            </strong>
            <span>{active.year}</span>
          </div>
        )}
      </div>

      {growth.length > 0 ? (
        <div
          className="growth-bars"
          role="img"
          aria-label="Annual employment growth"
          style={{
            gridTemplateColumns: `repeat(${growth.length}, minmax(90px, 1fr))`,
          }}
        >
          {growth.map((item, index) => {
            const positive = item.changePercent >= 0
            return (
              <button
                type="button"
                className={activeIndex === index ? 'active' : ''}
                key={item.year}
                onMouseEnter={() => setSelectedYear(item.year)}
                onFocus={() => setSelectedYear(item.year)}
                onClick={() => setSelectedYear(item.year)}
              >
                <span className="growth-bar-value">
                  {positive ? '+' : ''}
                  {item.changePercent.toFixed(1)}%
                </span>
                <div className="growth-bar-area">
                  <i
                    className={positive ? 'positive' : 'negative'}
                    style={{
                      height: `${Math.max((Math.abs(item.changePercent) / maxChange) * 100, 8)}%`,
                    }}
                  />
                </div>
                <strong>
                  {item.year}
                  {item.estimated
                    ? ' est.'
                    : 'monthsReported' in item &&
                        typeof item.monthsReported === 'number' &&
                        item.monthsReported < 12
                      ? ' YTD'
                      : ''}
                </strong>
                <small>{fmt.format(item.employed)} employed</small>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="college-empty">
          Annual employment history is unavailable.
        </p>
      )}

      <p className="sector-source-note">
        Source: U.S. Bureau of Labor Statistics Local Area Unemployment
        Statistics (LAUS). Annual values are monthly city-employment averages;
        Current-year estimates extend the latest reported employment using the
        most recent BLS QCEW covered-job growth rate and are marked “est.” This
        is resident employment growth, not GDP growth.
      </p>
      <div className="current-economy-grid">
        {isCurrentLoading ? (
          <div className="loading-panel">
            <LoadingSpinner size={32} label="Loading current labor data" />
          </div>
        ) : (
          <>
            <article>
              <span>Current unemployment</span>
              <strong>
                {current?.laus
                  ? `${current.laus.unemploymentRate.toFixed(1)}%`
                  : 'N/A'}
              </strong>
              <small>
                {current?.laus
                  ? `${current.laus.period} · ${current.laus.geography} · BLS LAUS`
                  : 'City-level LAUS unavailable'}
              </small>
            </article>
            <article>
              <span>Covered-job growth</span>
              <strong>
                {current?.qcew?.employmentGrowthPercent != null
                  ? `${current.qcew.employmentGrowthPercent >= 0 ? '+' : ''}${current.qcew.employmentGrowthPercent.toFixed(1)}%`
                  : 'N/A'}
              </strong>
              <small>
                {current?.qcew
                  ? `${current.qcew.period} · ${current.qcew.geography} · BLS QCEW`
                  : 'County QCEW unavailable'}
              </small>
            </article>
            <article>
              <span>Average weekly wage</span>
              <strong>
                {current?.qcew?.averageWeeklyWage
                  ? `$${fmt.format(current.qcew.averageWeeklyWage)}`
                  : 'N/A'}
              </strong>
              <small>
                {current?.qcew
                  ? `${current.qcew.period} · ${current.qcew.geography} · BLS QCEW`
                  : 'County QCEW unavailable'}
              </small>
            </article>
            <article>
              <span>Quarterly hires</span>
              <strong>
                {current?.qwi?.hires ? fmt.format(current.qwi.hires) : 'N/A'}
              </strong>
              <small>
                {current?.qwi
                  ? `${current.qwi.period} · ${current.qwi.geography} · Census QWI`
                  : 'County QWI unavailable'}
              </small>
            </article>
            <article>
              <span>Quarterly separations</span>
              <strong>
                {current?.qwi?.separations
                  ? fmt.format(current.qwi.separations)
                  : 'N/A'}
              </strong>
              <small>
                {current?.qwi
                  ? `${current.qwi.period} · ${current.qwi.geography} · Census QWI`
                  : 'County QWI unavailable'}
              </small>
            </article>
            <article>
              <span>Real GDP growth</span>
              <strong>
                {current?.bea
                  ? `${current.bea.growthPercent >= 0 ? '+' : ''}${current.bea.growthPercent.toFixed(1)}%`
                  : 'N/A'}
              </strong>
              <small>
                {current?.bea
                  ? `${current.bea.year} · ${current.bea.geography} · BEA`
                  : 'Add BEA_API_KEY for county GDP'}
              </small>
            </article>
          </>
        )}
      </div>
    </section>
  )
}
