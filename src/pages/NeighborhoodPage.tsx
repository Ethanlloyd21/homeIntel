import { MapPinned, Plus } from 'lucide-react'
import CitySelect from 'components/CitySelect'
import NeighborhoodColumn from 'components/NeighborhoodColumn'
import PageHeader from 'components/PageHeader'
import type { City } from 'data/cities'

const NeighborhoodPage = ({
  city,
  comparisonCity,
  setComparisonCity,
}: {
  city: City
  comparisonCity: City | null
  setComparisonCity: (city: City | null) => void
}) => (
  <div className="neighborhood-page">
    <PageHeader
      eyebrow="NEIGHBOURHOOD FOCUS"
      icon={MapPinned}
      title="City averages hide the decision. Pin the actual block."
      description="Pin a home and workplace to compare the actual commute and local hazard context. Each information icon explains what the number measures and which area it represents."
    />

    <div className="neighborhood-grid">
      <NeighborhoodColumn city={city} />
      {comparisonCity ? (
        <NeighborhoodColumn
          city={comparisonCity}
          onRemove={() => setComparisonCity(null)}
        />
      ) : (
        <div className="card neighborhood-empty">
          <span>
            <Plus size={22} aria-hidden="true" />
          </span>
          <strong>Compare a second neighbourhood</strong>
          <p>
            Add another city to place two specific addresses side by side —
            North Park against Plano, not San Diego against Dallas.
          </p>
          <CitySelect
            value={null}
            onChange={setComparisonCity}
            placeholder="Search a second city"
          />
        </div>
      )}
    </div>

    <p className="simulator-disclaimer">
      Hazard risk is the FEMA National Risk Index value for the census tract
      containing each pinned point. Housing figures stay city-level: HomeIntel
      does not model block-level prices, and says so rather than guessing.
    </p>
  </div>
)

export default NeighborhoodPage
