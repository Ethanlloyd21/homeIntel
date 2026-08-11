import type { City } from '../data/cities'
import SearchBox from './SearchBox'

export default function CitySelect({
  value,
  onChange,
}: {
  value: City
  onChange: (city: City) => void
}) {
  return (
    <div className="city-select city-select-search">
      <span style={{ background: value.color }}>{value.short}</span>
      <div>
        <strong>{value.name}</strong>
        <small>{[value.state, value.country].filter(Boolean).join(', ')}</small>
      </div>
      <SearchBox onSelect={onChange} compact />
    </div>
  )
}
