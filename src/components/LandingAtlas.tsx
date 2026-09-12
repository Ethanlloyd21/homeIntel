import { useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Home,
  MapPin,
  MoveUpRight,
  Pause,
  Play,
  Route,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import LandingRoutePicker from 'components/LandingRoutePicker'
import type { City } from 'data/cities'
import { landingRoutes } from 'data/landingRoutes'
import states from 'data/usMapPaths.json'
import { projectUS } from 'data/usMapProjection'
import { stateAbbreviations } from 'services/housing'
import { useProfileStore } from 'store/useProfileStore'

type Market = {
  city: string
  state: string
  rent?: number
  rentDate?: string
  homeValue?: number
  homeValueDate?: string
}
type MarketData = { markets: Market[] }
const dollars = (value?: number) =>
  value && value > 0
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    : 'Unavailable'
const month = (value?: string) =>
  value
    ? new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'Date unavailable'
const cityLabel = (city: City) =>
  `${city.name}, ${stateAbbreviations[city.state] ?? city.state}`
const findMarket = (data: MarketData | undefined, city: City | null) =>
  city
    ? data?.markets.find(
        (market) =>
          market.city.toLowerCase() === city.name.toLowerCase() &&
          market.state === (stateAbbreviations[city.state] ?? city.state),
      )
    : undefined

const HousingRow = ({
  label,
  from,
  to,
  fromDate,
  toDate,
  pending,
}: {
  label: string
  from?: number
  to?: number
  fromDate?: string
  toDate?: string
  pending: boolean
}) => {
  const comparable =
    !!from && !!to && from > 0 && to > 0 && !!fromDate && fromDate === toDate
  const change = comparable ? Math.round(((to! - from!) / from!) * 100) : null
  return (
    <div className="atlas-housing-row">
      <span>{label}</span>
      <div className="atlas-housing-values">
        <span>{pending ? 'Loading…' : dollars(from)}</span>
        <ArrowRight size={13} aria-hidden="true" />
        <strong>{pending ? 'Loading…' : dollars(to)}</strong>
      </div>
      <div className="atlas-measure" aria-hidden="true">
        <i
          style={{
            width: `${from && to ? Math.min(100, (from / Math.max(from, to)) * 100) : 0}%`,
          }}
        />
        <b
          style={{
            width: `${from && to ? Math.min(100, (to / Math.max(from, to)) * 100) : 0}%`,
          }}
        />
      </div>
      <small>
        {change !== null
          ? `${Math.abs(change)}% ${change < 0 ? 'lower' : change > 0 ? 'higher' : 'change'} · ${month(toDate)}`
          : pending
            ? 'Reading local market data'
            : `From: ${from ? month(fromDate) : 'unavailable'} · To: ${to ? month(toDate) : 'unavailable'}`}
      </small>
    </div>
  )
}

const LandingAtlas = ({ onStart }: { onStart: (city: City) => void }) => {
  const id = useId().replace(/:/g, '')
  const savedOrigin = useProfileStore((state) => state.originCity)
  const setOriginCity = useProfileStore((state) => state.setOriginCity)
  const originCity =
    savedOrigin?.country === 'United States' ? savedOrigin : null
  const [destination, setDestination] = useState<City | null>(null)
  const [example, setExample] = useState(0)
  const [mode, setMode] = useState<'housing' | 'life' | 'move'>('housing')
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [showExample, setShowExample] = useState(true)
  const sample = landingRoutes[example]
  const from = showExample ? sample.origin : originCity
  const to = showExample ? sample.destination : destination
  const start = from ? projectUS(from.longitude, from.latitude) : null
  const end = to ? projectUS(to.longitude, to.latitude) : null
  const route =
    start && end
      ? `M ${start[0]},${start[1]} Q ${(start[0] + end[0]) / 2},${Math.min(start[1], end[1]) - Math.min(145, Math.hypot(end[0] - start[0], end[1] - start[1]) * 0.4)} ${end[0]},${end[1]}`
      : null
  const marketQuery = useQuery({
    queryKey: ['landing-zillow-markets'],
    queryFn: async ({ signal }): Promise<MarketData> => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/zillow-market.json`,
        { signal },
      )
      if (!response.ok) throw new Error('Housing preview unavailable')
      return response.json()
    },
    staleTime: 24 * 60 * 60 * 1000,
  })
  const fromMarket = findMarket(marketQuery.data, from)
  const toMarket = findMarket(marketQuery.data, to)
  const useExample = () => {
    setOriginCity(sample.origin)
    setDestination(sample.destination)
    setShowExample(false)
  }

  return (
    <section
      className="atlas-experience"
      aria-labelledby="atlas-title"
      data-paused={paused}
    >
      <div className="atlas-intro">
        <div>
          <p className="landing-eyebrow">
            <span className="landing-signal" aria-hidden="true" /> THE AMERICAN
            POSSIBILITY ATLAS
          </p>
          <h1 id="atlas-title">
            Same you.
            <br />
            <span>A whole new</span> somewhere.
          </h1>
        </div>
        <div className="atlas-intro-aside">
          <p>
            A move changes more than your address.
            <br />
            See the money, the everyday, and the trade-offs
            <br className="atlas-desktop-break" /> before you call a new city
            home.
          </p>
          <a href="#start-exploring">
            Make your next move a considered one{' '}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="atlas-stage">
        <div className="atlas-map-area">
          <div className="atlas-map-heading">
            <span>
              <i /> UNITED STATES / RELOCATION EXPLORER
            </span>
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={
                paused ? 'Resume map animation' : 'Pause map animation'
              }
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          </div>
          <svg
            className="atlas-map"
            viewBox="0 0 980 615"
            role="img"
            aria-label={`United States map${from ? `, from ${cityLabel(from)}` : ''}${to ? ` to ${cityLabel(to)}` : ''}. Alaska and Hawaii shown as insets. The connecting curve is illustrative, not a driving route.`}
          >
            <defs>
              <pattern
                id={`${id}-grid`}
                width="38"
                height="38"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 38 0 L 0 0 0 38"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth=".5"
                />
              </pattern>
              <pattern
                id={`${id}-dots`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r=".6" fill="currentColor" />
              </pattern>
              <linearGradient id={`${id}-route`}>
                <stop stopColor="var(--atlas-origin-accent)" />
                <stop offset="1" stopColor="var(--coral)" />
              </linearGradient>
              <filter
                id={`${id}-glow`}
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            <rect
              width="980"
              height="615"
              fill={`url(#${id}-grid)`}
              className="atlas-grid"
            />
            <g className="atlas-map-depth" transform="translate(0 7)">
              {states.map((state) => (
                <path key={state.id} d={state.d} />
              ))}
            </g>
            <g className="atlas-states">
              {states.map((state) => (
                <path
                  key={state.id}
                  d={state.d}
                  className={
                    state.name === to?.state
                      ? 'is-destination'
                      : state.name === from?.state
                        ? 'is-origin'
                        : undefined
                  }
                >
                  <title>{state.name}</title>
                </path>
              ))}
            </g>
            <g className="atlas-map-dots" fill={`url(#${id}-dots)`}>
              {states.map((state) => (
                <path key={state.id} d={state.d} />
              ))}
            </g>
            <text x="52" y="595" className="atlas-inset-label">
              ALASKA & HAWAII / INSETS
            </text>
            <text x="900" y="580" className="atlas-compass">
              N ↑
            </text>
            {route && (
              <g key={`${from?.id}-${to?.id}`} fill="none">
                <path
                  d={route}
                  stroke={`url(#${id}-route)`}
                  strokeWidth="12"
                  opacity=".35"
                  filter={`url(#${id}-glow)`}
                />
                <path
                  d={route}
                  className="atlas-route"
                  pathLength="100"
                  stroke={`url(#${id}-route)`}
                  strokeWidth="2"
                />
                <path
                  d={route}
                  className="atlas-route-light"
                  pathLength="100"
                  stroke="var(--ink)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="2 98"
                />
              </g>
            )}
            {(
              [
                { point: start, city: from, kind: 'origin' },
                { point: end, city: to, kind: 'destination' },
              ] as const
            ).map(({ point, city, kind }) =>
              point && city ? (
                <g
                  key={kind}
                  className={`atlas-pin ${kind}`}
                  transform={`translate(${point[0]} ${point[1]})`}
                >
                  <circle r="20" className="atlas-pin-halo" />
                  <circle r="9" className="atlas-pin-ring" />
                  <circle r="4" />
                  <text
                    x={point[0] > 800 ? -17 : 17}
                    y={kind === 'origin' ? -19 : 5}
                    textAnchor={point[0] > 800 ? 'end' : 'start'}
                  >
                    {city.name}
                  </text>
                  <text
                    className="atlas-pin-caption"
                    x={point[0] > 800 ? -17 : 17}
                    y={kind === 'origin' ? -3 : 21}
                    textAnchor={point[0] > 800 ? 'end' : 'start'}
                  >
                    {kind === 'origin' ? 'LIFE TODAY' : 'A POSSIBLE TOMORROW'}
                  </text>
                </g>
              ) : null,
            )}
          </svg>
          <div className="atlas-map-bottom">
            <span>
              <i className="origin-dot" /> Where you are{' '}
              <i className="destination-dot" /> Where you could be
            </span>
            <small>Explore the possibilities. Then make them personal.</small>
          </div>
        </div>

        <aside className="atlas-inspector" aria-label="Route preview">
          <div className="atlas-inspector-kicker">
            <span>
              {showExample ? 'EXPLORE AN EXAMPLE' : 'YOUR ROUTE PREVIEW'}
            </span>
            <MoveUpRight size={17} aria-hidden="true" />
          </div>
          <div className="atlas-route-title" aria-live="polite">
            <span>{from ? cityLabel(from) : 'Your current city'}</span>
            <ArrowDown size={18} aria-hidden="true" />
            <h2>
              {to ? to.name : 'Your next home'}
              <span>
                {to
                  ? (stateAbbreviations[to.state] ?? to.state)
                  : 'Choose a U.S. city below'}
              </span>
            </h2>
          </div>
          <div className="atlas-lenses" role="group" aria-label="Preview topic">
            {(
              [
                { key: 'housing', icon: Home, label: 'Housing' },
                { key: 'life', icon: Sun, label: 'Daily life' },
                { key: 'move', icon: Route, label: 'The move' },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <div className="atlas-inspector-content" key={mode}>
            {mode === 'housing' ? (
              <>
                <HousingRow
                  label="Typical monthly rent"
                  from={fromMarket?.rent}
                  to={toMarket?.rent}
                  fromDate={fromMarket?.rentDate}
                  toDate={toMarket?.rentDate}
                  pending={marketQuery.isPending}
                />
                <HousingRow
                  label="Typical home value"
                  from={fromMarket?.homeValue}
                  to={toMarket?.homeValue}
                  fromDate={fromMarket?.homeValueDate}
                  toDate={toMarket?.homeValueDate}
                  pending={marketQuery.isPending}
                />
                <p className="atlas-source-note">
                  {marketQuery.isError ? (
                    <>
                      Market preview couldn’t load.{' '}
                      <button
                        type="button"
                        onClick={() => marketQuery.refetch()}
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      Zillow Research · city market indices.
                      <br />A market preview, not your personal budget.
                    </>
                  )}
                </p>
              </>
            ) : mode === 'life' ? (
              <div className="atlas-story">
                <span className="atlas-story-number">01 — THE EVERYDAY</span>
                <h3>Picture an ordinary Tuesday.</h3>
                <p>
                  Seasonal weather. The commute to work. Schools and services
                  close to home.
                </p>
                <ul>
                  <li>
                    <Check size={13} /> See a day in your life
                  </li>
                  <li>
                    <Check size={13} /> Explore real neighborhoods
                  </li>
                  <li>
                    <Check size={13} /> Check climate compatibility
                  </li>
                </ul>
                <small>Research a city to build your personal preview.</small>
              </div>
            ) : (
              <div className="atlas-story">
                <span className="atlas-story-number">
                  02 — THE NEXT CHAPTER
                </span>
                <h3>Turn “what if” into a plan.</h3>
                <p>
                  Your moving budget, a research trip, and a 90-day timeline.
                  One considered step at a time.
                </p>
                <ul>
                  <li>
                    <Check size={13} /> Account for moving costs
                  </li>
                  <li>
                    <Check size={13} /> Test-drive the hard season
                  </li>
                  <li>
                    <Check size={13} /> Build your move checklist
                  </li>
                </ul>
                <small>Research a city to start your move plan.</small>
              </div>
            )}
          </div>
          {showExample ? (
            <button
              className="atlas-use-route"
              type="button"
              onClick={useExample}
            >
              Make this my route <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <a className="atlas-use-route" href="#start-exploring">
              {destination
                ? 'Ready to look closer?'
                : 'Choose your destination'}{' '}
              <ArrowDown size={15} aria-hidden="true" />
            </a>
          )}
        </aside>
      </div>

      <div className="atlas-examples">
        <span>TAKE A DIFFERENT PATH</span>
        <div>
          {landingRoutes.map((item, index) => (
            <button
              type="button"
              key={item.label}
              aria-pressed={showExample && example === index}
              onClick={() => {
                setExample(index)
                setShowExample(true)
              }}
            >
              <span className="atlas-example-index">0{index + 1}</span>
              {item.label}
              <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <section
        className="landing-departure"
        id="start-exploring"
        aria-labelledby="departure-title"
      >
        <div className="departure-heading">
          <div>
            <p className="eyebrow">YOUR LIFE. YOUR COORDINATES.</p>
            <h2 id="departure-title">Where are you thinking?</h2>
          </div>
          <span>
            <MapPin size={13} aria-hidden="true" /> Built for moves within the
            United States
          </span>
        </div>
        <LandingRoutePicker
          onStart={(city) => {
            if (savedOrigin && !originCity) setOriginCity(null)
            onStart(city)
          }}
          originCity={originCity}
          setOriginCity={(city) => {
            setOriginCity(city)
            setShowExample(false)
          }}
          destination={destination}
          setDestination={(city) => {
            setDestination(city)
            setShowExample(false)
          }}
        />
        <p className="atlas-picker-note">
          <ShieldCheck size={12} aria-hidden="true" /> No account needed. Your
          household details stay on this device.
        </p>
      </section>
    </section>
  )
}

export default LandingAtlas
