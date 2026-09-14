import CardHeading from 'components/CardHeading'
import {
  CloudSun,
  Sun,
  Snowflake,
  Droplets,
  Fuel,
  TrafficCone,
  CalendarDays,
  Wind,
} from 'lucide-react'
import type { City } from 'data/cities'
import { useWeatherQuery } from 'hooks/useWeatherQuery'
import { useYearWeatherQuery } from 'hooks/useYearWeatherQuery'
import { useRiskQuery } from 'hooks/useRiskQuery'
import { useStormHistoryQuery } from 'hooks/useStormHistoryQuery'
import { useTrafficSummaryQuery } from 'hooks/useTrafficSummaryQuery'
import { gasPricePeriodLabel, useGasPriceQuery } from 'hooks/useGasPriceQuery'
import { trafficCondition } from 'services/traffic'
import type { ClimateMonth } from 'services/weatherOutlook'
import PageHeader from 'components/PageHeader'
import MetricCard from 'components/MetricCard'
import SourceChip from 'components/SourceChip'
import YearWeatherOutlook from 'components/YearWeatherOutlook'
import TrafficCommute from 'components/TrafficCommute'
import LoadingSpinner from 'components/LoadingSpinner'
const rounded = (n: number | null | undefined, suffix = '') =>
  n == null ? 'Unavailable' : `${Math.round(n)}${suffix}`
const roadNotes = (m: ClimateMonth) => {
  const notes = []
  if ((m.freezeDays ?? 0) >= 2)
    notes.push('Freezing nights: allow for icy bridges and shaded roads')
  if ((m.snowDays ?? 0) >= 1) notes.push('Snow is part of the seasonal pattern')
  if ((m.wetDays ?? 0) >= 5)
    notes.push('Rain: allow extra stopping distance and check drainage')
  if ((m.hotDays ?? 0) >= 5)
    notes.push('Frequent heat: check cooling and vehicle reliability')
  if ((m.windyDays ?? 0) >= 2)
    notes.push('Strong gusts can affect exposed roads')
  return notes.length
    ? notes.join('. ') + '.'
    : 'Fewer temperature-related triggers in the historical averages; check current road alerts before travel.'
}
const EnvironmentPage = ({ city }: { city: City }) => {
  const currentQuery = useWeatherQuery(city),
    current = currentQuery.data
  const outlookQuery = useYearWeatherQuery(city),
    outlook = outlookQuery.data
  const trafficQuery = useTrafficSummaryQuery(city),
    traffic = trafficQuery.data
  const gasPriceQuery = useGasPriceQuery(city),
    gasPrice = gasPriceQuery.data
  const risk = useRiskQuery(city),
    storms = useStormHistoryQuery(city, risk.data)
  const climate = outlook?.climate ?? []
  const ranked = (
    field: 'high' | 'low' | 'humidity' | 'precipitation',
    ascending = false,
  ) =>
    [...climate]
      .filter((m) => m[field] !== null)
      .sort((a, b) => (a[field]! - b[field]!) * (ascending ? 1 : -1))[0]
  const warmest = ranked('high'),
    coldest = ranked('low', true),
    humid = ranked('humidity'),
    wettest = ranked('precipitation')
  const stormSeason = (pattern: RegExp) => {
    if (!storms.data) return 'Local NOAA event history is still unavailable.'
    const counts = Array(12).fill(0) as number[]
    for (const area of [storms.data.county, storms.data.zone])
      for (const [type, h] of Object.entries(area?.hazards ?? {}))
        if (pattern.test(type)) h.months.forEach((n, i) => (counts[i] += n))
    const max = Math.max(...counts)
    return max > 0
      ? `${counts.flatMap((n, i) => (n === max ? [new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })] : [])).join(', ')} had the most matching reports in ${storms.data.startYear}–${storms.data.endYear}.`
      : 'No matching events in the loaded county/zone records; this does not establish zero risk.'
  }
  return (
    <div className="research-page environment-research">
      <PageHeader
        eyebrow={`${city.name.toUpperCase()} · WEATHER & ROADS`}
        icon={CloudSun}
        title="Picture every season of your life here."
        description="The daily weather, the roads you’ll use, and the seasonal conditions worth considering before a move."
      />
      <div className="research-stat-grid environment-stat-grid">
        <MetricCard
          label="Humidity now"
          icon={Droplets}
          value={rounded(current?.current.relative_humidity_2m, '%')}
          note={
            <>
              {currentQuery.isPending
                ? 'Loading current conditions'
                : 'Open-Meteo · modeled conditions'}
            </>
          }
          source="Current relative humidity"
          detail="Moisture in the air relative to saturation at the current temperature. This varies through the day; it is not the city's annual humidity."
        />
        <MetricCard
          label="Today’s high / low"
          icon={Sun}
          value={
            current
              ? `${rounded(current.daily.temperature_2m_max[0], '°')} / ${rounded(current.daily.temperature_2m_min[0], '°')}`
              : 'Unavailable'
          }
          note={<>Degrees Fahrenheit · local day</>}
        />
        <MetricCard
          label="Wind now"
          icon={Wind}
          value={rounded(current?.current.wind_speed_10m, ' mph')}
          note={<>Modeled speed at 10 metres above ground</>}
        />
        <MetricCard
          label="Current traffic"
          icon={TrafficCone}
          value={
            traffic
              ? trafficCondition(traffic.delayPercent).label
              : trafficQuery.isPending
                ? 'Loading…'
                : 'Unavailable'
          }
          note={
            <>
              {traffic
                ? `+${Math.round(traffic.delayPercent)}% delay · ${traffic.sampleCount} nearby roads`
                : 'Live traffic summary'}
              {traffic &&
                ` · ${new Date(traffic.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: city.timezone })}`}
            </>
          }
          source="TomTom nearby road samples"
          detail="Average delay relative to free flow on up to five unique sampled roads around the city centre. It is a small local sample, not a citywide congestion index. The map shows wider road coverage."
          valueKind="text"
        />
        <MetricCard
          label="Regular gas"
          icon={Fuel}
          value={
            gasPrice
              ? `$${gasPrice.price.toFixed(2)}`
              : gasPriceQuery.isPending
                ? 'Loading…'
                : 'Unavailable'
          }
          note={
            gasPriceQuery.isPending
              ? 'Loading EIA weekly price'
              : gasPrice
                ? `${gasPrice.area} · week of ${gasPricePeriodLabel(gasPrice.period)}`
                : 'Weekly price unavailable'
          }
          source="U.S. EIA weekly regular gasoline"
          detail={
            gasPrice
              ? `Average retail price including taxes for the ${gasPrice.area} reporting geography. EIA does not publish a city series for every location, so this is not a station quote.`
              : 'EIA weekly regular-gas averages are shown at the most specific supported metro, state, or regional geography. No unverified local value is substituted when the source is unavailable.'
          }
          sources={[
            {
              label: 'EIA weekly retail gasoline prices',
              href: 'https://www.eia.gov/petroleum/gasdiesel/',
            },
          ]}
        />
      </div>
      <TrafficCommute key={city.id} city={city} />
      <div className="research-section-head research-spaced">
        <div>
          <p className="eyebrow">
            <CalendarDays size={14} /> THE YEAR AHEAD
          </p>
          <h3>Plan beyond the forecast window.</h3>
        </div>
        <span className="research-status">
          {outlook?.historicalYears
            ? `${outlook.historicalYears} years loaded · ${outlook.baseline}`
            : outlookQuery.isFetching
              ? 'Loading climate history'
              : 'Climate history unavailable'}
        </span>
      </div>
      <YearWeatherOutlook
        outlook={outlook}
        isLoading={outlookQuery.isPending}
        isError={outlookQuery.isError}
        isFetching={outlookQuery.isFetching}
        errorMessage={outlookQuery.error?.message}
        historyLoaded={outlookQuery.historyLoaded}
        historyTotal={outlookQuery.historyTotal}
        onRetry={() => void outlookQuery.refetch()}
      />
      <section className="card research-panel research-spaced">
        <CardHeading
          icon={CloudSun}
          eyebrow="WHAT THIS MEANS"
          title="The seasons that shape daily life."
          action={
            <SourceChip
              source="Historical climate and NOAA event records"
              detail="Climate statistics use available Open-Meteo history from the previous ten calendar years; the loaded year count is shown above. Storm season summaries use the downloaded NOAA county and current forecast-zone records. These are retrospective patterns, not future event or traffic forecasts."
            />
          }
        />
        {outlookQuery.isPending ? (
          <LoadingSpinner label="Finding seasonal patterns" />
        ) : (
          <div className="season-insight-grid">
            <article>
              <Sun />
              <h4>Warmest stretch</h4>
              <p>
                {warmest
                  ? `${warmest.label} averages ${rounded(warmest.high, '°F')} for daytime highs, with about ${rounded(warmest.hotDays)} days reaching 90°F or more.`
                  : 'Temperature history unavailable.'}
              </p>
              <small>
                {outlook?.warmestDay
                  ? `Highest reanalysis high in ${outlook.baseline}: ${rounded(outlook.warmestDay.value, '°F')} on ${outlook.warmestDay.date}.`
                  : 'Historical extreme unavailable.'}
              </small>
            </article>
            <article>
              <Snowflake />
              <h4>Coldest stretch</h4>
              <p>
                {coldest
                  ? `${coldest.label} averages ${rounded(coldest.low, '°F')} for overnight lows; about ${rounded(coldest.freezeDays)} nights reach freezing.`
                  : 'Temperature history unavailable.'}
              </p>
              <small>
                {outlook?.coldestDay
                  ? `Lowest reanalysis low in ${outlook.baseline}: ${rounded(outlook.coldestDay.value, '°F')} on ${outlook.coldestDay.date}.`
                  : 'Historical extreme unavailable.'}
              </small>
            </article>
            <article>
              <Droplets />
              <h4>Moisture & rain</h4>
              <p>
                {humid
                  ? `${humid.label} has the highest mean relative humidity (${rounded(humid.humidity, '%')}).`
                  : ''}{' '}
                {wettest
                  ? `${wettest.label} is wettest on average, at ${wettest.precipitation?.toFixed(1)} inches.`
                  : ''}
              </p>
              <small>
                Relative humidity alone does not measure how muggy hot weather
                feels.
              </small>
            </article>
            <article>
              <Wind />
              <h4>Tornado & hail seasons</h4>
              <p>
                <b>Tornado:</b> {stormSeason(/Tornado/i)}
              </p>
              <p>
                <b>Hail:</b> {stormSeason(/Hail/i)}
              </p>
              <small>
                These are event reports within the county/zone, not odds for a
                home.
              </small>
            </article>
            <article>
              <CloudSun />
              <h4>Severe seasonal weather</h4>
              <p>
                <b>Winter:</b> {stormSeason(/Winter|Snow|Ice|Blizzard|Cold/i)}
              </p>
              <p>
                <b>Flood & tropical:</b>{' '}
                {stormSeason(/Flood|Hurricane|Tropical|Storm Surge/i)}
              </p>
              <small>
                Risk & resilience has the event history and reported damage.
              </small>
            </article>
            <article>
              <TrafficCone />
              <h4>Roads through the year</h4>
              <p>
                {traffic
                  ? `Current sampled-road delay is ${Math.round(traffic.delayPercent)}% above free flow.`
                  : 'Use the live traffic map to inspect current road conditions.'}{' '}
                Snow, freezing nights, rain, and gusts can change the trip
                substantially.
              </p>
              <small>
                Monthly road notes below are weather considerations. No monthly
                congestion or closure forecast is available.
              </small>
            </article>
          </div>
        )}
      </section>
      <section className="card research-panel research-spaced">
        <div className="research-section-head">
          <div>
            <p className="eyebrow">MONTH BY MONTH</p>
            <h3>What to plan around.</h3>
          </div>
        </div>
        <div className="season-table-scroll">
          <table className="season-table">
            <caption>
              {outlook?.baseline ?? 'Historical'} typical monthly weather and
              road considerations. Days are average counts per month.
            </caption>
            <thead>
              <tr>
                <th>Month</th>
                <th>High / low</th>
                <th>Humidity</th>
                <th>Wet days</th>
                <th>Freezing nights</th>
                <th>Road considerations</th>
              </tr>
            </thead>
            <tbody>
              {climate.map((m) => (
                <tr key={m.month}>
                  <th scope="row">{m.label}</th>
                  <td>
                    {rounded(m.high, '°')} / {rounded(m.low, '°')}
                  </td>
                  <td>{rounded(m.humidity, '%')}</td>
                  <td>{rounded(m.wetDays)}</td>
                  <td>{rounded(m.freezeDays)}</td>
                  <td>{roadNotes(m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="research-caption">
          <a
            href="https://open-meteo.com/en/docs/historical-weather-api"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo reanalysis
          </a>{' '}
          ·{' '}
          <a
            href="https://www.ncei.noaa.gov/stormevents/"
            target="_blank"
            rel="noreferrer"
          >
            NOAA Storm Events
          </a>
          . Typical weather is not a day-specific forecast. Verify current
          alerts before travel.
        </p>
      </section>
    </div>
  )
}
export default EnvironmentPage
