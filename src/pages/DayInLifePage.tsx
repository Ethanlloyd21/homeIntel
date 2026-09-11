import {
  CloudRain,
  Droplets,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Timer,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import LoadingSpinner from 'components/LoadingSpinner'
import PageHeader from 'components/PageHeader'
import PanelCard from 'components/PanelCard'
import Segmented from 'components/Segmented'
import SourceChip from 'components/SourceChip'
import type { City } from 'data/cities'
import { useCityIntel } from 'hooks/useCityIntel'
import { buildDayScenarios, type DayScenarioKey } from 'services/dayInLife'
import { useProfileStore } from 'store/useProfileStore'

const ComfortSlider = ({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
}) => (
  <label className="comfort-slider">
    <span>
      {label} <b>{value}°F</b>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
)

const DayInLifePage = ({ city }: { city: City }) => {
  const inputs = useProfileStore((state) => state.inputs)
  const setInput = useProfileStore((state) => state.setInput)
  const intel = useCityIntel(city)
  const [active, setActive] = useState<DayScenarioKey>('workday')

  const scenarios = useMemo(() => {
    if (!intel) return []
    const fuelPerDay =
      inputs.vehicleMpg > 0
        ? ((intel.commuteMiles ?? inputs.commuteMiles) * 2 * inputs.gasPrice) /
          inputs.vehicleMpg
        : null
    return buildDayScenarios({
      cityName: city.name,
      climate: intel.climate,
      inputs,
      commuteMinutes: intel.commuteMinutes,
      commuteMilesMeasured: intel.commuteMiles,
      trafficDelayPercent: intel.trafficDelayPercent,
      transitStopCount: intel.transitStopCount,
      nearestHospital: intel.nearestHospital,
      nearestSchool: null,
      nearestCollege: null,
      fuelCostPerCommuteDay: fuelPerDay,
    })
  }, [intel, inputs, city.name])

  const scenario = scenarios.find((entry) => entry.key === active)
  const climate = intel?.climate

  if (!intel) {
    return (
      <div className="dayinlife-page">
        <LoadingSpinner size={40} label="Loading this city" />
      </div>
    )
  }

  return (
    <div className="dayinlife-page">
      <PageHeader
        eyebrow="A DAY IN YOUR LIFE"
        icon={Sun}
        title={<>What a day in {city.name} actually looks like</>}
        description="Each scenario is built from a real observed day in this city's weather record, your commute, and the services nearest to you."
      />

      <section className="card comfort-card">
        <div>
          <strong>Your comfortable temperature range</strong>
          <p>
            Everything below — comfortable days, climate mismatch, and the
            season worth visiting in — recalculates against this band.
          </p>
        </div>
        <div className="comfort-sliders">
          <ComfortSlider
            label="Too cold below"
            value={inputs.comfortLowF}
            min={30}
            max={75}
            onChange={(value) =>
              setInput('comfortLowF', Math.min(value, inputs.comfortHighF - 5))
            }
          />
          <ComfortSlider
            label="Too hot above"
            value={inputs.comfortHighF}
            min={65}
            max={105}
            onChange={(value) =>
              setInput('comfortHighF', Math.max(value, inputs.comfortLowF + 5))
            }
          />
        </div>
      </section>

      {climate ? (
        <div className="climate-stats">
          {[
            {
              icon: Sun,
              value: climate.comfortableDaysPerYear,
              label: 'days a year in your range',
              tone: climate.comfortableDaysPerYear >= 150 ? 'good' : 'neutral',
            },
            {
              icon: Thermometer,
              value: climate.hotDaysPerYear,
              label: 'days a year reach 90°F',
              tone: climate.hotDaysPerYear > 80 ? 'alert' : 'neutral',
            },
            {
              icon: Snowflake,
              value: climate.freezingDaysPerYear,
              label: 'nights a year below freezing',
              tone: climate.freezingDaysPerYear > 90 ? 'caution' : 'neutral',
            },
            {
              icon: CloudRain,
              value: climate.wetDaysPerYear,
              label: 'wet days a year',
              tone: climate.wetDaysPerYear > 150 ? 'caution' : 'neutral',
            },
            {
              icon: Droplets,
              value: climate.snowDaysPerYear,
              label: 'days a year with snow',
              tone: 'neutral',
            },
          ].map((stat) => (
            <div key={stat.label} className={`climate-stat tone-${stat.tone}`}>
              <stat.icon size={17} aria-hidden="true" />
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </div>
          ))}
          <SourceChip
            source={`Open-Meteo historical archive, ${climate.yearsObserved} years of observed daily weather (${climate.firstDate} to ${climate.lastDate}).`}
            level="High"
          />
        </div>
      ) : (
        <div className="card empty-note">
          <LoadingSpinner size={20} label="Loading historical weather" />
          <span>Loading several years of observed daily weather…</span>
        </div>
      )}

      <Segmented
        label="Day scenario"
        value={active}
        onChange={setActive}
        options={scenarios.map((entry) => ({
          value: entry.key,
          label: entry.label,
          hint: entry.description,
        }))}
      />

      {scenario && (
        <div className="day-layout">
          <PanelCard
            eyebrow={scenario.label.toUpperCase()}
            title={
              scenario.basisDate
                ? `Based on ${new Date(`${scenario.basisDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
                : 'Typical conditions'
            }
            icon={Timer}
            className="day-timeline-card"
          >
            <div className="day-conditions">
              {scenario.conditions.high !== null && (
                <span>
                  <Thermometer size={14} />
                  {Math.round(scenario.conditions.high)}° /{' '}
                  {scenario.conditions.low !== null
                    ? `${Math.round(scenario.conditions.low)}°`
                    : '—'}
                </span>
              )}
              {scenario.conditions.sunrise && (
                <span>
                  <Sunrise size={14} />
                  {scenario.conditions.sunrise}
                </span>
              )}
              {scenario.conditions.sunset && (
                <span>
                  <Sunset size={14} />
                  {scenario.conditions.sunset}
                </span>
              )}
              {scenario.conditions.daylightHours !== null && (
                <span>
                  <Sun size={14} />
                  {scenario.conditions.daylightHours.toFixed(1)} h daylight
                </span>
              )}
            </div>
            <ol className="day-timeline">
              {scenario.moments.map((moment) => (
                <li
                  key={`${moment.time}-${moment.title}`}
                  className={`tone-${moment.tone}`}
                >
                  <span className="day-time">{moment.time}</span>
                  <div>
                    <strong>{moment.title}</strong>
                    <p>{moment.detail}</p>
                    <SourceChip source={moment.source} />
                  </div>
                </li>
              ))}
            </ol>
            <div className="day-footnotes">
              {scenario.footnotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </PanelCard>

          <PanelCard
            eyebrow="SEASONS"
            title="How the year is shaped"
            icon={CloudRain}
            className="seasons-card"
          >
            {climate ? (
              <div className="season-list">
                {climate.seasons.map((season) => (
                  <div key={season.key}>
                    <span>{season.label}</span>
                    <div className="season-bar">
                      <i
                        style={{
                          left: `${Math.max(0, Math.min(95, (((season.averageLow ?? 0) + 10) / 120) * 100))}%`,
                          width: `${Math.max(4, Math.min(60, (((season.averageHigh ?? 0) - (season.averageLow ?? 0)) / 120) * 100))}%`,
                        }}
                      />
                    </div>
                    <b>
                      {season.averageHigh !== null
                        ? `${Math.round(season.averageHigh)}°`
                        : '—'}{' '}
                      /{' '}
                      {season.averageLow !== null
                        ? `${Math.round(season.averageLow)}°`
                        : '—'}
                    </b>
                    <em>{season.wetDayShare.toFixed(0)}% wet days</em>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-note">Seasonal detail is still loading.</p>
            )}
          </PanelCard>
        </div>
      )}
    </div>
  )
}

export default DayInLifePage
