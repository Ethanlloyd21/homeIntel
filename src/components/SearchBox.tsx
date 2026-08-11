import { useDeferredValue, useState } from 'react'
import { ArrowRight, Map, Search } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { cityFromGeocoding, type City } from '../data/cities'
import { useLocationSearchQuery } from '../hooks/useLocationSearchQuery'

export default function SearchBox({
  onSelect,
  compact = false,
}: {
  onSelect: (city: City) => void
  compact?: boolean
}) {
  const [value, setValue] = useState('')
  const deferredValue = useDeferredValue(value.trim())
  const locationQuery = useLocationSearchQuery(deferredValue)

  const results = locationQuery.data ?? []

  return (
    <div className={`search-wrap ${compact ? 'search-compact' : ''}`}>
      <Search size={20} />
      <input
        value={value}
        aria-label="Search for a city"
        placeholder="Enter a city or ZIP code"
        onChange={(event) => setValue(event.target.value)}
      />
      {locationQuery.isFetching && (
        <LoadingSpinner size={18} label="Searching for locations" />
      )}
      {deferredValue.length >= 2 && !locationQuery.isFetching && (
        <div className="search-results">
          {locationQuery.isError ? (
            <p>Unable to search right now. Please try again.</p>
          ) : results.length ? (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onSelect(cityFromGeocoding(result))
                  setValue('')
                }}
              >
                <Map size={16} />
                <span>
                  {result.name}
                  <small>
                    {[result.admin1, result.country].filter(Boolean).join(', ')}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))
          ) : (
            <p>No matching locations</p>
          )}
        </div>
      )}
    </div>
  )
}
