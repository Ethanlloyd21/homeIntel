import { useEffect, useRef, useState } from 'react'
import { CloudRain, Snowflake, Sun, X } from 'lucide-react'
import LoadingSpinner from 'components/LoadingSpinner'
import type { YearWeatherOutlook as YearWeatherData } from 'hooks/useYearWeatherQuery'

type WeatherMonth = YearWeatherData['months'][number]

const sourceLabel = (source: WeatherMonth['source']) =>
  source === 'observed'
    ? 'Historical data'
    : source === 'partial'
      ? 'Partial month'
      : source === 'forecast'
        ? 'Seasonal forecast'
        : 'Not available yet'

const YearWeatherOutlook = ({
  outlook,
  isLoading,
  isError,
}: {
  outlook?: YearWeatherData
  isLoading: boolean
  isError: boolean
}) => {
  const [selectedMonth, setSelectedMonth] = useState<WeatherMonth | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const months = outlook?.months ?? []
  const reportedMonths = months.filter(
    (month) =>
      (month.source === 'observed' || month.source === 'partial') &&
      month.high !== null,
  )
  const warmest = [...reportedMonths].sort(
    (a, b) => (b.high ?? 0) - (a.high ?? 0),
  )[0]
  const coolest = [...reportedMonths].sort(
    (a, b) => (a.low ?? 0) - (b.low ?? 0),
  )[0]
  const wettest = [...reportedMonths].sort(
    (a, b) => (b.precipitation ?? 0) - (a.precipitation ?? 0),
  )[0]

  useEffect(() => {
    const dialog = dialogRef.current
    if (selectedMonth && dialog && !dialog.open) dialog.showModal()
  }, [selectedMonth])

  const closeMonth = () => {
    dialogRef.current?.close()
    setSelectedMonth(null)
  }

  return (
    <section className="card wide-chart year-weather-outlook">
      <div className="section-heading">
        <div>
          <small>CURRENT-YEAR WEATHER</small>
          <h3>Full-year weather outlook</h3>
        </div>
        <span className="people-period">{outlook?.year ?? 'Current year'}</span>
      </div>

      {isLoading ? (
        <div className="loading-panel">
          <LoadingSpinner size={34} label="Loading current-year weather" />
        </div>
      ) : isError || months.length === 0 ? (
        <div className="loading-panel">
          <p>Current-year weather is temporarily unavailable.</p>
        </div>
      ) : (
        <>
          <div className="year-weather-summary">
            <div>
              <Sun size={18} />
              <span>
                <small>WARMEST SO FAR</small>
                <strong>
                  {warmest.label} · {Math.round(warmest.high!)}° avg. high
                </strong>
              </span>
            </div>
            <div>
              <Snowflake size={18} />
              <span>
                <small>COOLEST SO FAR</small>
                <strong>
                  {coolest.label} · {Math.round(coolest.low!)}° avg. low
                </strong>
              </span>
            </div>
            <div>
              <CloudRain size={18} />
              <span>
                <small>WETTEST SO FAR</small>
                <strong>
                  {wettest.label} · {wettest.precipitation!.toFixed(1)} in
                </strong>
              </span>
            </div>
          </div>

          <div className="year-weather-grid">
            {months.map((month) => (
              <article key={month.key} data-source={month.source}>
                <button
                  type="button"
                  className="year-weather-month"
                  onClick={() => setSelectedMonth(month)}
                  aria-label={`View ${month.label} weather details`}
                >
                  <div className="year-weather-month-head">
                    <h4>{month.label}</h4>
                    <span data-source={month.source}>
                      {sourceLabel(month.source)}
                    </span>
                  </div>
                  <dl>
                    <div>
                      <dt>Avg. high</dt>
                      <dd>{month.high === null ? '—' : `${Math.round(month.high)}°`}</dd>
                    </div>
                    <div>
                      <dt>Avg. low</dt>
                      <dd>{month.low === null ? '—' : `${Math.round(month.low)}°`}</dd>
                    </div>
                    <div>
                      <dt>Precip.</dt>
                      <dd>
                        {month.precipitation === null
                          ? '—'
                          : `${month.precipitation.toFixed(1)} in`}
                      </dd>
                    </div>
                  </dl>
                  <small>
                    {month.source === 'partial'
                      ? `${month.daysReported} days included`
                      : 'View full month'}
                  </small>
                </button>
              </article>
            ))}
          </div>

          <div className="year-weather-legend">
            <span><i data-source="observed" /> Completed month</span>
            <span><i data-source="partial" /> Current partial month</span>
            <span><i data-source="forecast" /> Seasonal forecast</span>
          </div>
          <p className="year-weather-note">
            Open-Meteo historical weather through{' '}
            {outlook?.reportedThrough ?? 'the latest available date'}. Monthly
            values summarize modeled weather for the selected coordinates.
            Future months use the ECMWF SEAS5 seasonal ensemble forecast.
          </p>

          <dialog
            ref={dialogRef}
            className="year-weather-dialog"
            onClose={() => setSelectedMonth(null)}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeMonth()
            }}
          >
            {selectedMonth && (
              <div className="year-weather-dialog-card">
                <div className="year-weather-dialog-head">
                  <div>
                    <small>{sourceLabel(selectedMonth.source)}</small>
                    <h3>{selectedMonth.label} {outlook?.year} weather</h3>
                  </div>
                  <button
                    type="button"
                    className="year-weather-dialog-close"
                    onClick={closeMonth}
                    aria-label="Close month weather details"
                  >
                    <X size={22} aria-hidden="true" />
                  </button>
                </div>

                <p className="year-weather-dialog-period">
                  Full month · {selectedMonth.daysReported} days
                </p>
                <dl className="year-weather-dialog-stats">
                  <div>
                    <dt>Average daily high</dt>
                    <dd>{selectedMonth.high === null ? '—' : `${Math.round(selectedMonth.high)}°F`}</dd>
                  </div>
                  <div>
                    <dt>Average daily low</dt>
                    <dd>{selectedMonth.low === null ? '—' : `${Math.round(selectedMonth.low)}°F`}</dd>
                  </div>
                  <div>
                    <dt>Total precipitation</dt>
                    <dd>{selectedMonth.precipitation === null ? '—' : `${selectedMonth.precipitation.toFixed(1)} in`}</dd>
                  </div>
                </dl>
                <div className="year-weather-temperature-band">
                  <span>Typical daily temperature range</span>
                  <strong>
                    {selectedMonth.low === null ? '—' : `${Math.round(selectedMonth.low)}°F`}
                    <i aria-hidden="true" />
                    {selectedMonth.high === null ? '—' : `${Math.round(selectedMonth.high)}°F`}
                  </strong>
                </div>
                <p className="year-weather-dialog-note">
                  {selectedMonth.source === 'forecast'
                    ? 'This is a long-range monthly ensemble forecast, intended as a broad outlook rather than a day-by-day prediction.'
                    : selectedMonth.source === 'partial'
                      ? `This month is still in progress. Values include ${selectedMonth.daysReported} reported days through ${outlook?.reportedThrough}.`
                      : selectedMonth.source === 'observed'
                        ? 'These values summarize the completed month for the selected location.'
                        : 'Detailed weather values are not available for this month yet.'}
                </p>
              </div>
            )}
          </dialog>
        </>
      )}
    </section>
  )
}

export default YearWeatherOutlook
