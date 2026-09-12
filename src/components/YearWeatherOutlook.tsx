import { useState } from 'react'
import {
  ChevronDown,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Snowflake,
  Sun,
} from 'lucide-react'
import LoadingSpinner from 'components/LoadingSpinner'
import type { YearWeatherOutlook as YearWeatherData } from 'hooks/useYearWeatherQuery'

type WeatherMonth = YearWeatherData['months'][number]

const sourceLabel = (source: WeatherMonth['source']) =>
  source === 'observed'
    ? 'Historical data'
    : source === 'partial'
      ? 'Partial month'
      : source === 'forecast'
        ? 'Weather forecast'
        : source === 'typical'
          ? 'Historical expectation'
          : 'Not available yet'

const displayTemperature = (value: number | null) =>
  value === null ? '—' : `${Math.round(value)}°F`

const displayPrecipitation = (value: number | null) =>
  value === null ? '—' : `${value.toFixed(1)} in`

const describeWeather = (code: number | null) => {
  if (code === null) return 'Forecast not available'
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorms'
}

const WeatherIcon = ({ code }: { code: number | null }) => {
  if (code === null) return <Cloud size={20} aria-hidden="true" />
  if (code === 0) return <Sun size={20} aria-hidden="true" />
  if (code <= 3) return <CloudSun size={20} aria-hidden="true" />
  if (code <= 48) return <Cloud size={20} aria-hidden="true" />
  if (code >= 71 && code <= 77)
    return <CloudSnow size={20} aria-hidden="true" />
  if (code <= 82) return <CloudRain size={20} aria-hidden="true" />
  if (code <= 86) return <CloudSnow size={20} aria-hidden="true" />
  return <CloudLightning size={20} aria-hidden="true" />
}

const YearWeatherOutlook = ({
  outlook,
  isLoading,
  isError,
}: {
  outlook?: YearWeatherData
  isLoading: boolean
  isError: boolean
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState('')
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
  const currentMonthKey = outlook?.today.slice(0, 7)
  const defaultMonth =
    months.find((month) => month.key === currentMonthKey) ??
    reportedMonths.at(-1) ??
    months[0]
  const selectedMonth =
    months.find((month) => month.key === selectedMonthKey) ?? defaultMonth

  return (
    <section className="card wide-chart year-weather-outlook">
      <div className="section-heading monthly-weather-heading">
        <div>
          <small>MONTHLY WEATHER</small>
          <h3>Your year, day by day</h3>
        </div>
        {months.length > 0 && selectedMonth && (
          <label className="weather-month-select">
            <span className="sr-only">Select a month</span>
            <select
              aria-label="Select weather month"
              value={selectedMonth.key}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
            >
              {months.map((month) => (
                <option key={month.key} value={month.key}>
                  {month.label} {outlook?.year}
                </option>
              ))}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="loading-panel">
          <LoadingSpinner size={34} label="Loading monthly weather" />
        </div>
      ) : isError || months.length === 0 || !selectedMonth ? (
        <div className="loading-panel">
          <p>Monthly weather is temporarily unavailable.</p>
        </div>
      ) : (
        <>
          <div
            className="weather-month-tabs"
            role="group"
            aria-label="Choose weather month"
          >
            {months.map((month) => (
              <button
                type="button"
                key={month.key}
                aria-pressed={month.key === selectedMonth.key}
                onClick={() => setSelectedMonthKey(month.key)}
              >
                {month.label.slice(0, 3)}
                <small>
                  {month.source === 'typical'
                    ? 'Expected'
                    : month.source === 'observed'
                      ? 'History'
                      : 'Mixed'}
                </small>
              </button>
            ))}
          </div>
          {warmest && coolest && wettest && (
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
          )}

          <div className="monthly-weather-panel">
            <div className="monthly-weather-title">
              <div>
                <span data-source={selectedMonth.source}>
                  {sourceLabel(selectedMonth.source)}
                </span>
                <h4>
                  {selectedMonth.label} {outlook?.year} daily outlook
                </h4>
              </div>
              <div
                className="weather-calendar-legend"
                aria-label="Calendar legend"
              >
                <span>
                  <i data-source="observed" /> Observed
                </span>
                <span>
                  <i data-source="forecast" /> Forecast
                </span>
                <span>
                  <i data-source="typical" /> Historical expectation
                </span>
              </div>
            </div>

            <div className="weather-calendar-scroll">
              <div className="weather-calendar">
                <div className="weather-calendar-weekdays" aria-hidden="true">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    ),
                  )}
                </div>
                <div className="weather-calendar-days">
                  {Array.from(
                    {
                      length: new Date(
                        `${selectedMonth.key}-01T12:00:00Z`,
                      ).getUTCDay(),
                    },
                    (_, index) => (
                      <span
                        className="weather-calendar-blank"
                        key={`blank-${index}`}
                      />
                    ),
                  )}
                  {selectedMonth.days.map((day) => {
                    const isToday = day.date === outlook?.today
                    return (
                      <article
                        className="weather-calendar-day"
                        data-source={day.source}
                        data-today={isToday || undefined}
                        key={day.date}
                        aria-label={`${selectedMonth.label} ${day.day}: ${day.source === 'typical' ? 'Historical expectation, not a daily forecast' : describeWeather(day.weatherCode)}, high ${displayTemperature(day.high)}, low ${displayTemperature(day.low)}`}
                      >
                        <div className="weather-calendar-day-head">
                          <strong>{day.day}</strong>
                          {isToday && <span>Today</span>}
                        </div>
                        {day.source === 'typical' ? (
                          <CloudSun size={20} aria-hidden="true" />
                        ) : (
                          <WeatherIcon code={day.weatherCode} />
                        )}
                        <small>
                          {day.source === 'typical'
                            ? 'Typical range'
                            : describeWeather(day.weatherCode)}
                        </small>
                        {day.source === 'unavailable' ? (
                          <p>Insufficient data</p>
                        ) : (
                          <>
                            <div className="weather-calendar-temps">
                              <b>{displayTemperature(day.high)}</b>
                              <span>{displayTemperature(day.low)}</span>
                            </div>
                            <div className="weather-calendar-rain">
                              <Droplets size={12} aria-hidden="true" />
                              {day.source === 'typical'
                                ? `${Math.round(day.wetChance ?? 0)}% wet days`
                                : displayPrecipitation(day.precipitation)}
                            </div>
                          </>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <p className="year-weather-note">
            Daily forecasts extend through{' '}
            {outlook?.forecastThrough ?? 'the available forecast window'}. Later
            dates use {outlook?.baseline} Open-Meteo historical reanalysis,
            averaging dates within seven days of that calendar day. “Wet days”
            is the historical share with at least 0.01 inch of precipitation.
            These are planning expectations, not predictions of the exact
            weather on that future date. Historical reanalysis is modeled
            weather informed by observations.
          </p>
        </>
      )}
    </section>
  )
}

export default YearWeatherOutlook
