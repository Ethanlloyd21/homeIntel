import {
  Bike,
  Bus,
  Car,
  Clock3,
  ExternalLink,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Train,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import LoadingSpinner from 'components/LoadingSpinner'
import type { City } from 'data/cities'
import { useCommuteQuery } from 'hooks/useCommuteQuery'
import {
  distanceMiles,
  minutes,
  pointDistanceMiles,
  trafficCondition,
  trafficDelayPercent,
  type CommutePoint,
  type TransitPlace,
} from 'services/traffic'

const SelectPoint = ({
  onSelect,
}: {
  onSelect: (point: CommutePoint) => void
}) => {
  useMapEvents({
    click: (event) =>
      onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  })
  return null
}

const FitRoute = ({ points }: { points: CommutePoint[] }) => {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      const frame = requestAnimationFrame(() =>
        map.fitBounds(
          points.map(
            (point) => [point.latitude, point.longitude] as [number, number],
          ),
          { padding: [34, 34], maxZoom: 15 },
        ),
      )
      return () => cancelAnimationFrame(frame)
    }
  }, [map, points])
  return null
}

const timeLabel = (value: string) => {
  const [hour, minute] = value.split(':').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: minute ? '2-digit' : undefined,
  }).format(new Date(2026, 0, 1, hour, minute))
}

const modeIcon = (mode: TransitPlace['mode']) =>
  mode === 'Bus'
    ? Bus
    : mode === 'Train'
      ? Train
      : mode === 'Subway'
        ? Train
        : Route

const TrafficCommute = ({ city }: { city: City }) => {
  const cityCenter = useMemo(
    () => ({ latitude: city.latitude, longitude: city.longitude }),
    [city.latitude, city.longitude],
  )
  const [origin, setOrigin] = useState<CommutePoint>(cityCenter)
  const [destination, setDestination] = useState<CommutePoint | null>(null)
  const [selecting, setSelecting] = useState<'origin' | 'destination'>(
    'destination',
  )
  const commuteQuery = useCommuteQuery(origin, destination)
  const commute = commuteQuery.data
  const route = commute?.route
  const delayPercent = route
    ? trafficDelayPercent(route.travelTimeSeconds, route.freeFlowTimeSeconds)
    : 0
  const condition = trafficCondition(delayPercent)
  const rushProfiles = route?.profiles ?? []
  const slowestProfile = rushProfiles.reduce<
    (typeof rushProfiles)[number] | null
  >(
    (slowest, profile) =>
      !slowest || profile.travelTimeSeconds > slowest.travelTimeSeconds
        ? profile
        : slowest,
    null,
  )
  const maxProfileSeconds = Math.max(
    ...rushProfiles.map((profile) => profile.travelTimeSeconds),
    1,
  )
  const routePoints = route?.points ?? []
  const nearbyTransit = useMemo(() => {
    const unique = new Map<string, TransitPlace>()
    for (const place of commute?.transit ?? []) unique.set(place.id, place)
    return [...unique.values()]
      .map((place) => ({
        ...place,
        proximity: Math.min(
          pointDistanceMiles(origin, place),
          destination ? pointDistanceMiles(destination, place) : Infinity,
        ),
      }))
      .sort((left, right) => left.proximity - right.proximity)
      .slice(0, 10)
  }, [commute?.transit, destination, origin])
  const transitModes = [...new Set(nearbyTransit.map((place) => place.mode))]
  const routeMiles = route ? distanceMiles(route.distanceMeters) : 0
  const routeColor =
    condition.tone === 'severe'
      ? '#c7473b'
      : condition.tone === 'heavy'
        ? '#df7a37'
        : condition.tone === 'moderate'
          ? '#d4a437'
          : '#27816a'

  const setMapPoint = (point: CommutePoint) => {
    if (selecting === 'origin') {
      setOrigin(point)
      setSelecting('destination')
    } else {
      setDestination(point)
    }
  }

  return (
    <section className="traffic-commute-section">
      <div className="traffic-heading">
        <div>
          <p className="eyebrow">TRAFFIC &amp; COMMUTE</p>
          <h2>Plan a real point-to-point trip</h2>
          <span>
            Choose Start or Destination, then click the map. HomeIntel compares
            current travel time with free-flow conditions and samples typical
            weekday rush-hour windows.
          </span>
        </div>
        <div className="traffic-source-state">
          <span
            className={
              !route ? 'waiting' : route.trafficAvailable ? 'live' : 'baseline'
            }
          >
            <i />{' '}
            {!route
              ? 'Route not selected'
              : route.trafficAvailable
                ? 'Live traffic'
                : 'Baseline routing'}
          </span>
          <small>
            {!route
              ? 'Choose two points to calculate a commute'
              : route.trafficAvailable
                ? 'Current conditions refresh every 2 minutes'
                : route.note}
          </small>
        </div>
      </div>

      <div className="traffic-planner card">
        <div className="traffic-point-controls">
          <button
            className={selecting === 'origin' ? 'active' : ''}
            onClick={() => setSelecting('origin')}
          >
            <span>A</span>
            <div>
              <small>START</small>
              <strong>
                {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
              </strong>
            </div>
          </button>
          <button
            className={selecting === 'destination' ? 'active' : ''}
            onClick={() => setSelecting('destination')}
          >
            <span>B</span>
            <div>
              <small>DESTINATION</small>
              <strong>
                {destination
                  ? `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`
                  : 'Click the map to choose'}
              </strong>
            </div>
          </button>
          <button
            className="traffic-reset"
            title="Reset route"
            aria-label="Reset route to city center"
            onClick={() => {
              setOrigin(cityCenter)
              setDestination(null)
              setSelecting('destination')
            }}
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="traffic-map">
          <MapContainer
            center={[city.latitude, city.longitude]}
            zoom={12}
            scrollWheelZoom
            doubleClickZoom
            keyboard
            zoomControl
            minZoom={3}
            maxZoom={18}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SelectPoint onSelect={setMapPoint} />
            {routePoints.length > 1 && (
              <>
                <FitRoute points={routePoints} />
                <Polyline
                  positions={routePoints.map((point) => [
                    point.latitude,
                    point.longitude,
                  ])}
                  pathOptions={{ color: routeColor, weight: 6, opacity: 0.88 }}
                />
              </>
            )}
            <CircleMarker
              center={[origin.latitude, origin.longitude]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#3478c7',
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Tooltip direction="top">Start</Tooltip>
            </CircleMarker>
            {destination && (
              <CircleMarker
                center={[destination.latitude, destination.longitude]}
                radius={9}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#d65e45',
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Tooltip direction="top">Destination</Tooltip>
              </CircleMarker>
            )}
            {nearbyTransit.map((place) => (
              <CircleMarker
                key={place.id}
                center={[place.latitude, place.longitude]}
                radius={4}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#7659dc',
                  fillOpacity: 0.9,
                  weight: 1,
                }}
              >
                <Tooltip direction="top">
                  {place.mode}: {place.name}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="traffic-map-hint">
            <LocateFixed size={14} /> Click to set{' '}
            {selecting === 'origin' ? 'the start' : 'the destination'}
          </div>
          <div className="traffic-map-legend">
            <span>
              <i className="route-light" /> Light
            </span>
            <span>
              <i className="route-moderate" /> Moderate
            </span>
            <span>
              <i className="route-heavy" /> Heavy
            </span>
            <span>
              <i className="transit-dot" /> Transit stop
            </span>
          </div>
        </div>

        {!destination ? (
          <div className="traffic-empty">
            <MapPin size={25} />
            <h3>Choose a destination on the map</h3>
            <p>
              Your start point defaults to {city.name}. Select either point at
              any time to move it.
            </p>
          </div>
        ) : commuteQuery.isPending ? (
          <div className="traffic-empty">
            <LoadingSpinner
              size={34}
              label="Calculating traffic and commute options"
            />
          </div>
        ) : !route ? (
          <div className="traffic-empty traffic-error">
            <TriangleAlert size={25} />
            <h3>Route unavailable</h3>
            <p>
              {commute?.routeError ??
                'Try two closer points or try again shortly.'}
            </p>
          </div>
        ) : (
          <div className="traffic-results">
            <div className="traffic-now-grid">
              <article>
                <Clock3 size={18} />
                <span>Travel time now</span>
                <strong>{minutes(route.travelTimeSeconds)} min</strong>
                <small>{routeMiles.toFixed(1)} miles</small>
              </article>
              <article>
                <Navigation size={18} />
                <span>Traffic delay</span>
                <strong>
                  {route.trafficAvailable
                    ? `+${minutes(route.trafficDelaySeconds)} min`
                    : 'Not available'}
                </strong>
                <small>
                  {route.trafficAvailable
                    ? `${Math.round(delayPercent)}% over free flow`
                    : 'Baseline duration only'}
                </small>
              </article>
              <article className={`traffic-condition-${condition.tone}`}>
                <Car size={18} />
                <span>Current traffic</span>
                <strong>
                  {route.trafficAvailable ? condition.label : 'Not live'}
                </strong>
                <small>
                  {route.trafficAvailable
                    ? `Free flow: ${minutes(route.freeFlowTimeSeconds)} min · as of ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : route.provider}
                </small>
              </article>
            </div>

            {route.trafficAvailable && rushProfiles.length > 0 ? (
              <div className="rush-profile">
                <div className="rush-profile-heading">
                  <div>
                    <small>TYPICAL WEEKDAY</small>
                    <h3>Rush-hour slowdown windows</h3>
                  </div>
                  <span>
                    Slowest sample: <b>{timeLabel(slowestProfile!.time)}</b> ·{' '}
                    {minutes(slowestProfile!.travelTimeSeconds)} min
                  </span>
                </div>
                <div className="rush-bars">
                  {rushProfiles.map((profile) => {
                    const profileDelay = trafficDelayPercent(
                      profile.travelTimeSeconds,
                      profile.freeFlowTimeSeconds,
                    )
                    return (
                      <div key={profile.time}>
                        <span>{timeLabel(profile.time)}</span>
                        <div>
                          <i
                            style={{
                              width: `${(profile.travelTimeSeconds / maxProfileSeconds) * 100}%`,
                            }}
                          />
                        </div>
                        <b>{minutes(profile.travelTimeSeconds)} min</b>
                        <small>+{Math.round(profileDelay)}%</small>
                      </div>
                    )
                  })}
                </div>
                <p>{route.note}</p>
              </div>
            ) : (
              <p className="traffic-setup-note">
                <TriangleAlert size={15} /> {route.note} Rush-hour and live
                slowdown results are hidden until traffic data is available.
              </p>
            )}
          </div>
        )}
      </div>

      {route && (
        <div className="commute-options-grid">
          <section className="card commute-modes">
            <div className="section-heading">
              <div>
                <small>COMMUTE OPTIONS</small>
                <h3>Ways to make this trip</h3>
              </div>
            </div>
            <div className="commute-mode-list">
              <div>
                <span>
                  <Car size={18} />
                </span>
                <div>
                  <strong>Drive</strong>
                  <small>
                    {route.trafficAvailable
                      ? 'Current traffic-aware route'
                      : 'Baseline road route'}
                  </small>
                </div>
                <b>{minutes(route.travelTimeSeconds)} min</b>
              </div>
              <div>
                <span>
                  <Bike size={18} />
                </span>
                <div>
                  <strong>Bicycle estimate</strong>
                  <small>
                    Distance-only estimate at 12 mph; route suitability not
                    checked
                  </small>
                </div>
                <b>{Math.max(1, Math.round((routeMiles / 12) * 60))} min</b>
              </div>
              <div>
                <span>
                  <Footprints size={18} />
                </span>
                <div>
                  <strong>Walking estimate</strong>
                  <small>
                    Distance-only estimate at 3 mph; pedestrian route not
                    checked
                  </small>
                </div>
                <b>{Math.max(1, Math.round((routeMiles / 3) * 60))} min</b>
              </div>
              <div>
                <span>
                  <Bus size={18} />
                </span>
                <div>
                  <strong>Public transit nearby</strong>
                  <small>
                    {transitModes.length
                      ? `${transitModes.join(', ')} mapped near either endpoint`
                      : 'No mapped stops returned near the endpoints'}
                  </small>
                </div>
                <b>{nearbyTransit.length} stops</b>
              </div>
            </div>
          </section>

          <section className="card nearby-transit">
            <div className="section-heading">
              <div>
                <small>BUS &amp; RAIL ACCESS</small>
                <h3>Nearby mapped stops</h3>
              </div>
              <Train size={18} />
            </div>
            {nearbyTransit.length ? (
              <div className="transit-stop-list">
                {nearbyTransit.slice(0, 6).map((place) => {
                  const Icon = modeIcon(place.mode)
                  return (
                    <div key={place.id}>
                      <span>
                        <Icon size={15} />
                      </span>
                      <div>
                        <strong>{place.name}</strong>
                        <small>
                          {place.mode}
                          {place.operator ? ` · ${place.operator}` : ''}
                        </small>
                      </div>
                      <b>{place.proximity.toFixed(1)} mi</b>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="transit-empty">
                {commute?.transitError ??
                  'No bus or rail stops were mapped within 1.6 miles of either endpoint.'}
              </p>
            )}
          </section>
        </div>
      )}

      <p className="traffic-disclaimer">
        Traffic changes quickly. Rush windows are sampled typical-weekday
        estimates, not guarantees. Transit stops come from OpenStreetMap and do
        not include schedules, fares, service alerts, accessibility, or a
        transit itinerary. Verify the trip with the local transit operator.{' '}
        <a
          href="https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/calculate-route"
          target="_blank"
          rel="noreferrer"
        >
          TomTom methodology <ExternalLink size={11} />
        </a>
      </p>
    </section>
  )
}

export default TrafficCommute
