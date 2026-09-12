import { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  History,
  ArrowUpRight,
  CircleDollarSign,
} from 'lucide-react'
import type { City } from 'data/cities'
import PageHeader from 'components/PageHeader'
import SourceChip from 'components/SourceChip'
import LoadingSpinner from 'components/LoadingSpinner'
import { useRiskQuery } from 'hooks/useRiskQuery'
import { useStormHistoryQuery } from 'hooks/useStormHistoryQuery'

const dollars = (value: number | null | undefined) =>
  value == null
    ? 'Unavailable'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const RiskPage = ({ city }: { city: City }) => {
  const riskQuery = useRiskQuery(city),
    risk = riskQuery.data
  const historyQuery = useStormHistoryQuery(city, risk),
    history = historyQuery.data
  const [metric, setMetric] = useState<'loss' | 'score'>('loss')
  const [scope, setScope] = useState<'county' | 'zone'>('county')
  const [eventOrder, setEventOrder] = useState<'recent' | 'costliest'>(
    'costliest',
  )
  const area = history?.[scope]
  const hazards = [...(risk?.hazards ?? [])].sort((a, b) =>
    metric === 'loss'
      ? (b.annualLoss ?? -1) - (a.annualLoss ?? -1)
      : b.score - a.score,
  )
  const max =
    metric === 'score'
      ? 100
      : Math.max(1, ...hazards.map((h) => h.annualLoss ?? 0))
  const yearMax = Math.max(
    1,
    ...Object.values(area?.years ?? {}).map((y) => y.property + y.crop),
  )
  const ready = Boolean(risk)
  return (
    <div className="research-page risk-research">
      <PageHeader
        eyebrow={`${city.name.toUpperCase()} · RISK & RESILIENCE`}
        icon={ShieldAlert}
        title="Know the exposure. Plan for recovery."
        description="Understand the hazards, the damage that has been reported, and the community’s capacity to recover—with the meaning and geography behind every number."
      />
      <div className="research-intro-strip">
        <ShieldCheck size={19} />
        <span>
          Local context matters. FEMA figures describe the census tract at the
          city centre. NOAA history describes its county and current forecast
          zone; it does not establish damage at a particular home.
        </span>
      </div>
      {riskQuery.isPending ? (
        <div className="card research-loading">
          <LoadingSpinner label="Loading FEMA risk and resilience" />
        </div>
      ) : riskQuery.isError ? (
        <div className="card research-loading">
          <p>FEMA risk data could not load.</p>
          <button
            className="ghost-button"
            onClick={() => void riskQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : null}
      <div className="research-stat-grid">
        <article className="card">
          <span>
            Relative annual loss
            <SourceChip
              source="FEMA Expected Annual Loss score"
              detail="A relative 0–100 index of modeled loss potential across census tracts. It is not a disaster probability, a percentage of your home value, or a safety grade. Higher means greater relative loss potential."
            />
          </span>
          <strong>{risk ? `${risk.score}/100` : 'Unavailable'}</strong>
          <small>
            {risk?.rating ?? 'FEMA tract score'} · higher means more loss
            potential
          </small>
        </article>
        <article className="card">
          <span>
            Expected loss per year
            <SourceChip
              source="Modeled annual loss, not historical damage"
              detail="FEMA combines hazard frequency, exposed assets, and historical loss ratios. The total includes building and agricultural loss plus a statistical dollar equivalent of population impacts. It is a long-run expectation for the entire tract, not an insurance quote."
            />
          </span>
          <strong>{dollars(risk?.annualLoss)}</strong>
          <small>Whole tract · includes valued population impacts</small>
        </article>
        <article className="card">
          <span>
            Community resilience
            <SourceChip
              source="FEMA community resilience"
              detail="Modeled capacity to prepare for, adapt to, and recover from hazards. Higher scores indicate greater resilience. This is a community measure, not a rating of your house or proof of a fast recovery."
            />
          </span>
          <strong>
            {risk?.resilienceScore != null
              ? `${risk.resilienceScore}/100`
              : 'Unavailable'}
          </strong>
          <small>
            {risk?.resilienceRating ?? 'No resilience rating'} · higher means
            greater resilience
          </small>
        </article>
        <article className="card">
          <span>
            Social vulnerability
            <SourceChip
              source="FEMA social vulnerability"
              detail="Community characteristics associated with difficulty preparing for and recovering from hazards. Higher scores indicate greater modeled vulnerability. This describes an area and must not be used to label an individual household."
            />
          </span>
          <strong>
            {risk?.socialVulnerabilityScore != null
              ? `${risk.socialVulnerabilityScore}/100`
              : 'Unavailable'}
          </strong>
          <small>
            {risk?.socialVulnerabilityRating ?? 'No vulnerability rating'}
          </small>
        </article>
      </div>
      <div className="research-two-column">
        <section className="card research-panel">
          <div className="research-section-head">
            <div>
              <p className="eyebrow">FEMA · MODELED EXPOSURE</p>
              <h3>What drives the loss potential?</h3>
            </div>
            <div
              className="research-toggle"
              role="group"
              aria-label="Hazard chart measure"
            >
              <button
                aria-pressed={metric === 'loss'}
                onClick={() => setMetric('loss')}
              >
                Annual loss
              </button>
              <button
                aria-pressed={metric === 'score'}
                onClick={() => setMetric('score')}
              >
                Relative score
              </button>
            </div>
          </div>
          <p className="research-caption">
            {metric === 'loss'
              ? 'Comparable dollars across hazards, for the whole tract. Select a hazard for its underlying measures.'
              : 'Each score compares this tract with other U.S. tracts for that hazard. Scores across hazards are not probabilities.'}
          </p>
          <div className="hazard-chart">
            {hazards.map((h) => {
              const value = metric === 'loss' ? h.annualLoss : h.score
              return (
                <details key={h.label} className="hazard-chart-row">
                  <summary>
                    <span>{h.label}</span>
                    <span className="hazard-bar-track">
                      <i
                        style={{
                          width: `${value === null ? 0 : (value / max) * 100}%`,
                        }}
                      />
                    </span>
                    <b>{metric === 'loss' ? dollars(value) : `${value}/100`}</b>
                  </summary>
                  <div className="hazard-explanation">
                    <p>
                      {h.rating} relative annual loss · {h.score}/100. Expected
                      building loss: {dollars(h.buildingLoss)} per year.
                    </p>
                    <p>
                      {h.historicalBuildingLossRatio === null
                        ? 'A historical building loss ratio was not supplied.'
                        : `Historical building loss ratio: ${(h.historicalBuildingLossRatio * 100).toPrecision(3)}% of exposed building value per hazard occurrence in FEMA’s model. This is an input to expected loss, not a total of local damage claims.`}
                    </p>
                  </div>
                </details>
              )
            })}
          </div>
          {ready && !hazards.length && (
            <p>No hazard-level measures were returned.</p>
          )}
          <p className="research-caption">
            {risk?.county ?? city.state} · Census tract{' '}
            {risk?.tract ?? 'not matched'} · FEMA release{' '}
            {risk?.version ?? 'unavailable'}. Missing or inapplicable hazard
            scores are omitted.{' '}
            <a
              href="https://hazards.fema.gov/nri/data-resources"
              target="_blank"
              rel="noreferrer"
            >
              FEMA methodology ↗
            </a>
          </p>
        </section>
        <aside className="card research-panel research-meaning">
          <p className="eyebrow">WHAT THIS MEANS</p>
          <h3>Turn the numbers into questions.</h3>
          <div>
            <span>01</span>
            <p>
              <b>A score is a comparison.</b>{' '}
              {risk
                ? `${risk.score}/100 (${risk.rating}) describes modeled loss potential for the tract.`
                : 'Wait for a matched FEMA tract before assessing the score.'}{' '}
              It does not mean {risk?.score ?? 40}% of homes will be damaged.
            </p>
          </div>
          <div>
            <span>02</span>
            <p>
              <b>Separate buildings from the total.</b>{' '}
              {risk
                ? `FEMA models ${dollars(risk.buildingLoss)} in annual building loss and ${dollars(risk.agricultureLoss)} in agricultural loss for this tract.`
                : 'Loss components appear when FEMA data loads.'}{' '}
              The headline also values population impacts, so it is not an
              amount that homeowners pay.
            </p>
          </div>
          <div>
            <span>03</span>
            <p>
              <b>Research the actual address.</b>{' '}
              {hazards[0]
                ? `${hazards[0].label} has the ${metric === 'loss' ? 'largest modeled annual loss' : 'highest relative score'} among the listed hazards.`
                : ''}{' '}
              Review flood maps, the building’s condition, local evacuation
              routes, and the community hazard-mitigation plan.
            </p>
          </div>
          <div>
            <span>04</span>
            <p>
              <b>Recovery is part of the decision.</b> Ask about backup power,
              access to essential services, emergency communications, and
              whether more than one road connects the neighborhood to the rest
              of the city.
            </p>
          </div>
          <a
            className="research-source-link"
            href="https://www.ready.gov/be-informed"
            target="_blank"
            rel="noreferrer"
          >
            Explore hazard-specific preparation <ArrowUpRight size={14} />
          </a>
        </aside>
      </div>
      <section className="card research-panel storm-history">
        <div className="research-section-head">
          <div>
            <p className="eyebrow">
              <History size={14} /> NOAA · REPORTED EVENTS
            </p>
            <h3>What has happened in the area?</h3>
          </div>
          <div
            className="research-toggle"
            role="group"
            aria-label="Historical event geography"
          >
            <button
              aria-pressed={scope === 'county'}
              onClick={() => setScope('county')}
            >
              County
            </button>
            <button
              aria-pressed={scope === 'zone'}
              onClick={() => setScope('zone')}
            >
              Weather zone
            </button>
          </div>
        </div>
        <p className="research-caption">
          {history
            ? `${history.startYear}–${history.endYear}`
            : 'Five most recent completed data years'}{' '}
          ·{' '}
          {scope === 'county'
            ? `${risk?.county ?? 'Selected'} County`
            : (history?.zoneId ?? 'Forecast zone')}
          . NOAA assigns flash floods, hail, tornadoes, and many thunderstorms
          to counties; widespread heat, winter weather, and wildfire often use
          weather zones. Examine both views. Current zone boundaries may differ
          from historical ones.
        </p>
        {historyQuery.isPending ? (
          <div className="research-loading">
            {riskQuery.isError ? (
              'A matched county is required.'
            ) : (
              <LoadingSpinner label="Loading NOAA event history" />
            )}
          </div>
        ) : historyQuery.isError ? (
          <p>
            NOAA event history is unavailable.{' '}
            <button
              className="ghost-button"
              onClick={() => void historyQuery.refetch()}
            >
              Try again
            </button>
          </p>
        ) : !area ? (
          <p>
            {scope === 'zone' && history?.zoneUnavailable
              ? 'The current forecast zone could not be matched. County records remain available.'
              : 'No matching area records were found in this dataset. This is not proof that the area has no hazard exposure.'}
          </p>
        ) : (
          <>
            <div className="storm-summary">
              <div>
                <CircleDollarSign size={20} />
                <strong>{dollars(area.property + area.crop)}</strong>
                <span>Reported property + crop damage</span>
              </div>
              <div>
                <strong>{area.count.toLocaleString()}</strong>
                <span>Event records · not distinct storms</span>
              </div>
              <div>
                <strong>{area.unknownLoss.toLocaleString()}</strong>
                <span>Records with a missing damage field</span>
              </div>
            </div>
            <div
              className="storm-year-chart"
              aria-label="Reported damage by year"
            >
              {Array.from(
                { length: history!.endYear - history!.startYear + 1 },
                (_, i) => String(history!.startYear + i),
              ).map((year) => {
                const row = area.years[year]
                return (
                  <div key={year}>
                    <span>{year}</span>
                    <div>
                      <i
                        style={{
                          width: `${(((row?.property ?? 0) + (row?.crop ?? 0)) / yearMax) * 100}%`,
                        }}
                      />
                    </div>
                    <b>{dollars((row?.property ?? 0) + (row?.crop ?? 0))}</b>
                    <small>{row?.count ?? 0} records</small>
                  </div>
                )
              })}
            </div>
            <p className="research-caption">
              NOAA estimates in nominal dollars as reported, not
              inflation-adjusted, insured losses, or a complete loss inventory.
              Missing damage fields are excluded from totals; recorded zero is
              retained. One storm can produce multiple event records. County and
              zone totals are shown separately.
            </p>
            <h4>Hazards and seasonal concentration</h4>
            <div className="storm-hazard-grid">
              {Object.entries(area.hazards)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([type, h]) => {
                  const maxCount = Math.max(...h.months)
                  const peak = h.months.flatMap((n, i) =>
                    n === maxCount && n > 0 ? [months[i]] : [],
                  )
                  return (
                    <div key={type}>
                      <b>{type}</b>
                      <span>
                        {h.count} records · {dollars(h.property + h.crop)}{' '}
                        reported
                      </span>
                      <small>
                        Most records: {peak.join(', ') || 'No seasonal match'}
                      </small>
                    </div>
                  )
                })}
            </div>
            <div className="research-section-head">
              <h4>Event details</h4>
              <div
                className="research-toggle"
                role="group"
                aria-label="Event list order"
              >
                <button
                  aria-pressed={eventOrder === 'costliest'}
                  onClick={() => setEventOrder('costliest')}
                >
                  Highest reported damage
                </button>
                <button
                  aria-pressed={eventOrder === 'recent'}
                  onClick={() => setEventOrder('recent')}
                >
                  Most recent
                </button>
              </div>
            </div>
            <div className="storm-event-list">
              {area[eventOrder].map((e) => (
                <details key={e.id}>
                  <summary>
                    <time>{dateLabel(e.date)}</time>
                    <span>
                      <b>{e.type}</b>
                      <small>{e.area}</small>
                    </span>
                    <strong>
                      {e.property === null && e.crop === null
                        ? 'Damage not reported'
                        : dollars((e.property ?? 0) + (e.crop ?? 0))}
                    </strong>
                  </summary>
                  <p>{e.narrative || 'No event narrative was provided.'}</p>
                  <p>
                    {e.deaths} reported fatalities · {e.injuries} reported
                    injuries.{' '}
                    <a
                      href={`https://www.ncei.noaa.gov/stormevents/eventdetails.jsp?id=${e.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      NOAA event record ↗
                    </a>
                  </p>
                </details>
              ))}
            </div>
          </>
        )}
        <a
          className="research-source-link"
          href="https://www.ncei.noaa.gov/stormevents/"
          target="_blank"
          rel="noreferrer"
        >
          NOAA Storm Events Database <ArrowUpRight size={14} />
        </a>
      </section>
    </div>
  )
}
export default RiskPage
