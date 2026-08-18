import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { Map } from 'lucide-react'
import type { City } from 'data/cities'

const RecenterMap = ({ city }: { city: City }) => {
  const map = useMap()

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const frame = requestAnimationFrame(() => {
      if (reducedMotion) {
        map.setView([city.latitude, city.longitude], 13)
      } else {
        map.flyTo([city.latitude, city.longitude], 13, {
          animate: true,
          duration: 2.4,
          easeLinearity: 0.2,
        })
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [city, map])

  return null
}

const CityMap = ({ city }: { city: City }) => {
  return (
    <section className="map-card card">
      <div className="map-toolbar">
        <div>
          <span className="live-dot" />
          Live map
        </div>
        <span className="map-interaction-hint">
          Drag to explore · Scroll to zoom
        </span>
      </div>
      <div className="map-visual">
        <MapContainer
          center={[city.latitude, city.longitude]}
          zoom={9}
          scrollWheelZoom
          doubleClickZoom
          keyboard
          zoomControl
          minZoom={3}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
        >
          <RecenterMap city={city} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={[city.latitude, city.longitude]}
            radius={10}
            pathOptions={{
              color: city.color,
              fillColor: city.color,
              fillOpacity: 0.85,
            }}
          >
            <Tooltip permanent direction="top">
              {city.name}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>
      <div className="place-card">
        <div className="place-icon">
          <Map size={18} />
        </div>
        <div>
          <small>EXPLORING</small>
          <h2>
            {city.name}
            {city.state ? `, ${city.state}` : ''}
          </h2>
          <p>
            {city.country} · {city.latitude.toFixed(3)},{' '}
            {city.longitude.toFixed(3)}
          </p>
        </div>
      </div>
    </section>
  )
}

export default CityMap
