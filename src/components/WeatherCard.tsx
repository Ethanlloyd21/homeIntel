import { CloudSun } from 'lucide-react'
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

export default function WeatherCard({ city }: { city: City }) {
  const weatherQuery = useWeatherQuery(city)
  const weather = weatherQuery.data

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
          <div className="weather-stats">
            <div>
              <span>Humidity</span>
              <b>{weather.current.relative_humidity_2m}%</b>
            </div>
            <div>
              <span>High / Low</span>
              <b>
                {Math.round(weather.daily.temperature_2m_max[0])}° /{' '}
                {Math.round(weather.daily.temperature_2m_min[0])}°
              </b>
            </div>
            <div>
              <span>Wind</span>
              <b>{Math.round(weather.current.wind_speed_10m)} mph</b>
            </div>
          </div>
          <p className="risk-note">
            Updated{' '}
            {new Date(weather.current.time).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            · Open-Meteo
          </p>
        </>
      )}
    </section>
  )
}
