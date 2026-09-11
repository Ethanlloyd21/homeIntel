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
  setComparisonCity: (city: City) => void
}) => (
  <div className="neighborhood-page">
    <PageHeader
      eyebrow="NEIGHBOURHOOD FOCUS"
      icon={MapPinned}
      title="City averages hide the decision. Pin the actual block."
      description="Hazard risk, commute time, and service access change street by street. Pin a home point and a workplace, and every number below is measured from there — including the commute the rest of the app uses."
    />

    <div className="neighborhood-grid">
      <NeighborhoodColumn city={city} />
      {comparisonCity ? (
        <NeighborhoodColumn city={comparisonCity} />
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
