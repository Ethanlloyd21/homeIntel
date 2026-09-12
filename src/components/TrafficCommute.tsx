import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import {
  Expand,
  LocateFixed,
  RefreshCw,
  TrafficCone,
  Clock3,
} from 'lucide-react'
import type { City } from 'data/cities'
import { trafficDays } from 'utils/trafficTiming'

const MapTools = ({ city }: { city: City }) => {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return (
    <button
      type="button"
      className="traffic-city-reset"
      aria-label={`Recenter traffic map on ${city.name}`}
      onClick={() => map.setView([city.latitude, city.longitude], 13)}
    >
      <LocateFixed size={18} />
      <span>{city.name}</span>
    </button>
  )
}
const timeLabel = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
const TrafficCommute = ({ city }: { city: City }) => {
  const [mode, setMode] = useState<'live' | 'typical'>('live')
  const [day, setDay] = useState(1),
    [time, setTime] = useState('09:00')
  const [refresh, setRefresh] = useState(() => Date.now())
  const mapShell = useRef<HTMLDivElement>(null)
  const [tileState, setTileState] = useState({
    key: '',
    failed: false,
    loaded: false,
  })
  const status = useQuery({
    queryKey: ['traffic-status-v2'],
    queryFn: async ({ signal }) => {
      const r = await fetch('/api/traffic-status', { signal })
      if (!r.ok) throw new Error('Traffic service unavailable')
      return (await r.json()) as {
        configured: boolean
        typicalConfigured: boolean
      }
    },
    staleTime: 120000,
    retry: false,
  })
  useEffect(() => {
    if (mode !== 'live') return
    const timer = window.setInterval(() => setRefresh(Date.now()), 120000)
    return () => window.clearInterval(timer)
  }, [mode])
  const configured =
    mode === 'live' ? status.data?.configured : status.data?.typicalConfigured
  const key = `${mode}|${day}|${time}|${city.timezone}|${refresh}`
  const failed =
    status.isError ||
    (!status.isPending && configured === false) ||
    (tileState.key === key && tileState.failed)
  const loaded = tileState.key === key && tileState.loaded && !failed
  const selectedLabel = `${trafficDays[day]} at ${timeLabel(time)}`
  const params = new URLSearchParams({
    mode,
    day: String(day),
    time,
    timeZone: city.timezone,
    v: String(refresh),
  })
  return (
    <section className="traffic-commute-section traffic-only">
      <div className="research-section-head">
        <div>
          <p className="eyebrow">
            <TrafficCone size={14} /> THE ROADS AROUND YOU
          </p>
          <h3>Traffic, at a glance.</h3>
          <p className="research-caption">
            Explore the road network in {city.name}. Pan, zoom, or expand the
            map for a closer look.
          </p>
        </div>
        <span className="research-status" data-live={mode === 'live' && loaded}>
          {mode === 'typical'
            ? selectedLabel
            : loaded
              ? 'Live traffic'
              : failed
                ? 'Traffic unavailable'
                : 'Loading traffic'}
        </span>
      </div>
      <div className="card traffic-map-card" ref={mapShell}>
        <div className="traffic-time-controls">
          <div
            className="traffic-mode-toggle"
            role="group"
            aria-label="Traffic map mode"
          >
            <button
              type="button"
              aria-pressed={mode === 'live'}
              onClick={() => {
                setMode('live')
                setRefresh(Date.now())
              }}
            >
              Live traffic
            </button>
            <button
              type="button"
              aria-pressed={mode === 'typical'}
              onClick={() => setMode('typical')}
            >
              Day &amp; time
            </button>
          </div>
          {mode === 'typical' && (
            <>
              <label>
                Day
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                >
                  {trafficDays.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Time
                <select value={time} onChange={(e) => setTime(e.target.value)}>
                  {Array.from({ length: 48 }, (_, i) => {
                    const t = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`
                    return (
                      <option key={t} value={t}>
                        {timeLabel(t)}
                      </option>
                    )
                  })}
                </select>
              </label>
              <small>{city.timezone}</small>
            </>
          )}
          <div className="traffic-map-actions">
            <button
              type="button"
              className="ghost-button"
              aria-label="Refresh traffic"
              onClick={() => {
                setRefresh(Date.now())
                void status.refetch()
              }}
            >
              <RefreshCw size={15} />
            </button>
            <button
              type="button"
              className="ghost-button"
              aria-label="Expand traffic map"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen()
                else void mapShell.current?.requestFullscreen()
              }}
            >
              <Expand size={15} />
            </button>
          </div>
        </div>
        <div className="traffic-map traffic-network-map">
          <MapContainer
            center={[city.latitude, city.longitude]}
            zoom={13}
            minZoom={5}
            maxZoom={18}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              className="traffic-roads-basemap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {configured && (
              <TileLayer
                key={key}
                className="traffic-flow-tiles"
                url={`/api/traffic-tiles/{z}/{x}/{y}.png?${params}`}
                attribution={
                  mode === 'live'
                    ? 'Traffic &copy; <a href="https://www.tomtom.com/">TomTom</a>'
                    : 'Typical traffic &copy; <a href="https://www.esri.com/">Esri</a> and data suppliers'
                }
                opacity={0.95}
                zIndex={250}
                eventHandlers={{
                  tileerror: () =>
                    setTileState({ key, failed: true, loaded: false }),
                  load: () =>
                    setTileState((current) => ({
                      key,
                      failed: current.key === key && current.failed,
                      loaded: true,
                    })),
                }}
              />
            )}
            <MapTools city={city} />
          </MapContainer>
          {!status.isPending && (!configured || failed) && (
            <div className="traffic-unavailable" role="status">
              <Clock3 size={24} />
              <h4>
                {mode === 'typical'
                  ? `${selectedLabel} traffic is unavailable`
                  : 'Live traffic is unavailable'}
              </h4>
              <p>
                {mode === 'typical' && !configured
                  ? 'Historical road-speed data is not connected for this map. Selecting a day or time cannot create it.'
                  : 'The traffic provider could not load road conditions. Missing colors do not mean roads are clear.'}
              </p>
              {mode === 'typical' && (
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => setMode('live')}
                >
                  Show live traffic
                </button>
              )}
            </div>
          )}
        </div>
        <div className="traffic-network-footer">
          <div
            className="traffic-speed-legend"
            aria-label="Road traffic speed legend"
          >
            <span>Faster</span>
            <i />
            <span>Slower</span>
          </div>
          <p role="status">
            {mode === 'live'
              ? 'Current road speeds · refreshes every 2 minutes'
              : configured
                ? 'Typical road speeds for the selected weekday and local time. Historical averages, not a prediction of a specific incident.'
                : 'Typical traffic requires a connected historical traffic data service.'}
          </p>
        </div>
      </div>
    </section>
  )
}
export default TrafficCommute
