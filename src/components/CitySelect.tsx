import type { City } from 'data/cities'
import SearchBox from 'components/SearchBox'

const CitySelect = ({
  value,
  onChange,
  placeholder = 'Search for a city',
}: {
  value: City | null
  onChange: (city: City) => void
  placeholder?: string
}) => {
  return (
    <div className="city-select-search">
      <SearchBox
        key={value?.id ?? 'empty-city'}
        onSelect={onChange}
        placeholder={placeholder}
        initialValue={
          value ? [value.name, value.state].filter(Boolean).join(', ') : ''
        }
      />
    </div>
  )
}

export default CitySelect
