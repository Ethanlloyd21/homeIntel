import { ArrowRight, CloudSun } from 'lucide-react'
import type { City } from '../data/cities'
import LoadingSpinner from './LoadingSpinner'
import { useWeatherQuery } from '../hooks/useWeatherQuery'

function describeWeather(code: number) {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorms'
}

function weatherComfort({
  apparentTemperature,
  humidity,
  wind,
  precipitation,
  weatherCode,
}: {
  apparentTemperature: number
  humidity: number
  wind: number
  precipitation: number
  weatherCode: number
}) {
  const temperaturePenalty = Math.min(
    55,
    Math.abs(apparentTemperature - 72) * 2.2,
  )
  const humidityDistance =
    humidity < 35 ? 35 - humidity : Math.max(0, humidity - 60)
  const humidityPenalty = Math.min(20, humidityDistance * 0.7)
  const windPenalty = Math.min(15, Math.max(0, wind - 15) * 1.2)
  const precipitationPenalty = Math.min(15, precipitation * 8)
  const stormPenalty = weatherCode >= 95 ? 12 : 0
  const score = Math.round(
    Math.max(
      0,
      100 -
        temperaturePenalty -
        humidityPenalty -
        windPenalty -
        precipitationPenalty -
        stormPenalty,
    ),
  )

  if (score >= 85) return { score, label: 'Excellent', tone: 'excellent' }
  if (score >= 70) return { score, label: 'Comfortable', tone: 'comfortable' }
  if (score >= 50) return { score, label: 'Fair', tone: 'fair' }
  return { score, label: 'Uncomfortable', tone: 'uncomfortable' }
}

export default function WeatherCard({
  city,
  onViewEnvironment,
}: {
  city: City
  onViewEnvironment: () => void
}) {
  const weatherQuery = useWeatherQuery(city)
  const weather = weatherQuery.data
  const comfort = weather
    ? weatherComfort({
        apparentTemperature: weather.current.apparent_temperature,
        humidity: weather.current.relative_humidity_2m,
        wind: weather.current.wind_speed_10m,
        precipitation: weather.current.precipitation,
        weatherCode: weather.current.weather_code,
      })
    : null

  return (
    <section className="card weather">
      <div className="section-heading">
        <div>
          <small>LIVE WEATHER</small>
          <h3>Today in {city.name}</h3>
        </div>
      </div>
      {weatherQuery.isError ? (
        <p>Live weather is temporarily unavailable.</p>
      ) : !weather ? (
        <div className="loading-panel">
          <LoadingSpinner size={30} label="Loading current weather" />
        </div>
      ) : (
        <>
          <div className="weather-main">
            <strong>{Math.round(weather.current.temperature_2m)}°</strong>
            <span>
              {describeWeather(weather.current.weather_code)}
              <small>
                Feels like {Math.round(weather.current.apparent_temperature)}°
              </small>
            </span>
            <CloudSun className="weather-icon" aria-hidden="true" />
          </div>
          {comfort && (
            <div
              className={`comfort-scale comfort-${comfort.tone}`}
              title="HomeIntel estimate based on apparent temperature, humidity, wind, precipitation, and storm conditions."
            >
              <div className="comfort-scale-heading">
                <span>Outdoor comfort</span>
                <b>
                  {comfort.label} · {comfort.score}/100
                </b>
              </div>
              <div
                className="comfort-scale-track"
                role="meter"
                aria-label={`Outdoor comfort: ${comfort.label}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={comfort.score}
              >
                <i style={{ width: `${comfort.score}%` }} />
                <span style={{ left: `${comfort.score}%` }} />
              </div>
              <small>
                Estimated from feels-like temperature, humidity, wind and
                precipitation
              </small>
            </div>
          )}
          <p className="risk-note">
            <span>
              Updated{' '}
              {new Date(weather.current.time).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              · Open-Meteo
            </span>
            <button type="button" onClick={onViewEnvironment}>
              Environment details <ArrowRight size={12} />
            </button>
          </p>
        </>
      )}
    </section>
  )
}
