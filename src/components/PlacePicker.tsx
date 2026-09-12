import { useQuery } from '@tanstack/react-query'
import { Crosshair, MapPin, X } from 'lucide-react'
import { useState } from 'react'
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
  city: string,
  state: string,
  signal: AbortSignal,
) => {
  const params = new URLSearchParams({ q: query, near, city, state })
  const response = await fetch(`/api/place-search?${params}`, { signal })
  if (!response.ok) throw new Error('Place search is unavailable.')
  const payload = (await response.json()) as { places: PlaceResult[] }
  return payload.places
}

const usePlaceSearch = (
  query: string,
  near: string,
  city: string,
  state: string,
) =>
  useQuery({
    queryKey: ['place-search', query.toLowerCase(), near, city, state],
    queryFn: ({ signal }) => fetchPlaces(query, near, city, state, signal),
    enabled: query.trim().length >= 3,
    staleTime: 7 * 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

const PlacePicker = ({
  label,
  hint,
  value,
  onChange,
  near,
  city = '',
  state = '',
  fallbackLabel,
  onUseFallback,
}: {
  label: string
  hint: string
  value: GeoPoint | null
  onChange: (point: GeoPoint | null) => void
  /** "lat,lon" used to bias results toward the city being researched. */
  near: string
  city?: string
  state?: string
  fallbackLabel?: string
  onUseFallback?: () => void
}) => {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const search = usePlaceSearch(submitted, near, city, state)
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
              setSubmitted('')
            }}
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <form
          className="place-picker-search"
          onSubmit={(event) => {
            event.preventDefault()
            if (query.trim().length < 3) return
            if (submitted === query.trim()) void search.refetch()
            else setSubmitted(query.trim())
          }}
        >
          <MapPin size={16} aria-hidden="true" />
          <input
            value={query}
            placeholder={
              city
                ? `Street address in ${city}`
                : 'Street address, neighbourhood, or landmark'
            }
            aria-label={`Search a location for ${label}`}
            onChange={(event) => {
              setQuery(event.target.value)
              setSubmitted('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSubmitted('')
            }}
          />
          <button
            type="submit"
            className="ghost-button"
            disabled={query.trim().length < 3 || search.isFetching}
          >
            Search
          </button>
          {search.isFetching && (
            <LoadingSpinner size={16} label="Searching locations" />
          )}
          {submitted && !search.isFetching && (
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
                      setSubmitted('')
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
                <p>
                  {city
                    ? `No matching places in ${city}, ${state}. Check the street number and name.`
                    : 'No matching places. Include the city and state for an address outside this city.'}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

export default PlacePicker
