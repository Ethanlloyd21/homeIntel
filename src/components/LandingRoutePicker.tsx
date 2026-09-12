import { ArrowRight, MapPin, X } from 'lucide-react'
import SearchBox from 'components/SearchBox'
import type { City } from 'data/cities'

const Leg = ({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string
  hint: string
  value: City | null
  placeholder: string
  onChange: (city: City | null) => void
}) => (
  <div className={`route-leg ${value ? 'set' : ''}`}>
    <label className="route-leg-label">
      {label}
      <small>{hint}</small>
    </label>
    {value ? (
      <div className="route-leg-chosen">
        <MapPin size={16} aria-hidden="true" />
        <span>
          {value.name}
          {value.state ? `, ${value.state}` : ''}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X size={15} />
        </button>
      </div>
    ) : (
      <SearchBox
        onSelect={onChange}
        placeholder={placeholder}
        countryCode="US"
        ariaLabel={label}
      />
    )}
  </div>
)

/**
 * Sets the whole move in one place before entering the app. The destination is
 * held locally rather than written straight to the app store, because writing
 * it immediately leaves the landing page and would make it impossible to fill
 * in the origin afterwards.
 */
const LandingRoutePicker = ({
  onStart,
  originCity,
  setOriginCity,
  destination,
  setDestination,
}: {
  onStart: (destination: City) => void
  originCity: City | null
  setOriginCity: (city: City | null) => void
  destination: City | null
  setDestination: (city: City | null) => void
}) => {
  return (
    <form
      className="landing-route"
      onSubmit={(event) => {
        event.preventDefault()
        if (destination) onStart(destination)
      }}
    >
      <Leg
        label="Where you live now"
        hint="Optional, but it unlocks every comparison"
        value={originCity}
        placeholder="Your current U.S. city"
        onChange={setOriginCity}
      />
      <span className="route-arrow" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
      <Leg
        label="Where you're thinking of moving"
        hint="The city you want to research"
        value={destination}
        placeholder="U.S. city or ZIP code"
        onChange={setDestination}
      />
      <button type="submit" className="route-start" disabled={!destination}>
        {destination ? `Research ${destination.name}` : 'Choose a city'}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  )
}

export default LandingRoutePicker
