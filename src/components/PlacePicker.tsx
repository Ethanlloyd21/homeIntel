import { useQuery } from '@tanstack/react-query'
import { Crosshair, MapPin, X } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import LoadingSpinner from 'components/LoadingSpinner'
import type { GeoPoint } from 'store/useProfileStore'

type PlaceResult = GeoPoint & {
  id: string
  fullLabel: string
  kind: string
}

const fetchPlaces = async (
  query: string,
  near: string,
  signal: AbortSignal,
) => {
  const params = new URLSearchParams({ q: query, near })
  const response = await fetch(`/api/place-search?${params}`, { signal })
  if (!response.ok) throw new Error('Place search is unavailable.')
  const payload = (await response.json()) as { places: PlaceResult[] }
  return payload.places
}

const usePlaceSearch = (query: string, near: string) =>
  useQuery({
    queryKey: ['place-search', query.toLowerCase(), near],
    queryFn: ({ signal }) => fetchPlaces(query, near, signal),
    enabled: query.trim().length >= 3,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })

const PlacePicker = ({
  label,
  hint,
  value,
  onChange,
  near,
  fallbackLabel,
  onUseFallback,
}: {
  label: string
  hint: string
  value: GeoPoint | null
  onChange: (point: GeoPoint | null) => void
  /** "lat,lon" used to bias results toward the city being researched. */
  near: string
  fallbackLabel?: string
  onUseFallback?: () => void
}) => {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const search = usePlaceSearch(deferred, near)
  const results = search.data ?? []

  return (
    <div className="place-picker">
      <div className="place-picker-head">
        <span>
          <strong>{label}</strong>
          <small>{hint}</small>
        </span>
        {fallbackLabel && onUseFallback && !value && (
          <button
            type="button"
            className="ghost-button"
            onClick={onUseFallback}
          >
            <Crosshair size={13} /> {fallbackLabel}
          </button>
        )}
      </div>

      {value ? (
        <div className="place-picker-value">
          <MapPin size={15} aria-hidden="true" />
          <span>
            <b>{value.label}</b>
            <small>
              {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
            </small>
          </span>
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange(null)
              setQuery('')
            }}
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="place-picker-search">
          <MapPin size={16} aria-hidden="true" />
          <input
            value={query}
            placeholder="Street address, neighbourhood, or landmark"
            aria-label={`Search a location for ${label}`}
            onChange={(event) => setQuery(event.target.value)}
          />
          {search.isFetching && (
            <LoadingSpinner size={16} label="Searching locations" />
          )}
          {deferred.trim().length >= 3 && !search.isFetching && (
            <div className="search-results">
              {search.isError ? (
                <p>Place search is unavailable right now.</p>
              ) : results.length ? (
                results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        label: result.label,
                        latitude: result.latitude,
                        longitude: result.longitude,
                      })
                      setQuery('')
                    }}
                  >
                    <MapPin size={15} />
                    <span>
                      {result.label}
                      <small>{result.fullLabel}</small>
                    </span>
                  </button>
                ))
              ) : (
                <p>No matching places</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PlacePicker
