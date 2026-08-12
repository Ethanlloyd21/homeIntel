import { useDeferredValue, useState } from 'react'
import { ArrowRight, Map, Search } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { cityFromGeocoding, type City } from '../data/cities'
import { useLocationSearchQuery } from '../hooks/useLocationSearchQuery'

export default function SearchBox({
  onSelect,
  compact = false,
  placeholder = 'Enter a city or ZIP code',
  initialValue = '',
}: {
  onSelect: (city: City) => void
  compact?: boolean
  placeholder?: string
  initialValue?: string
}) {
  const [value, setValue] = useState(initialValue)
  const [editing, setEditing] = useState(false)
  const deferredValue = useDeferredValue(editing ? value.trim() : '')
  const locationQuery = useLocationSearchQuery(deferredValue)

  const results = locationQuery.data ?? []

  return (
    <div
      className={`search-wrap ${compact ? 'search-compact' : ''} transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-400/40`}
    >
      <Search size={20} />
      <input
        value={value}
        aria-label="Search for a city"
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value)
          setEditing(true)
        }}
        onFocus={(event) => {
          if (initialValue && !editing) event.currentTarget.select()
        }}
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
                  setValue(
                    [result.name, result.admin1].filter(Boolean).join(', '),
                  )
                  setEditing(false)
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
