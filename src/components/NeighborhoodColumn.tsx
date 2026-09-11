import {
  Building2,
  Car,
  GraduationCap,
  Hospital,
  School,
  ShieldAlert,
  TrainFront,
} from 'lucide-react'
import LoadingSpinner from 'components/LoadingSpinner'
import PlacePicker from 'components/PlacePicker'
import SourceChip from 'components/SourceChip'
import type { City } from 'data/cities'
import { useCityIntel } from 'hooks/useCityIntel'
import { useCommuteQuery } from 'hooks/useCommuteQuery'
import { useNearbyCollegesQuery } from 'hooks/useNearbyCollegesQuery'
import { useNearbySchoolsQuery } from 'hooks/useNearbySchoolsQuery'
import { usePointRiskQuery } from 'hooks/usePointRiskQuery'
import {
  minutes,
  pointDistanceMiles,
  trafficCondition,
  trafficDelayPercent,
} from 'services/traffic'
import { useProfileStore, type GeoPoint } from 'store/useProfileStore'

const Row = ({
  icon: Icon,
  label,
  value,
  note,
  tone = 'neutral',
}: {
  icon: typeof Car
  label: string
  value: string
  note?: string
  tone?: 'good' | 'caution' | 'alert' | 'neutral'
}) => (
  <div className={`neighborhood-row tone-${tone}`}>
    <span className="neighborhood-row-icon">
      <Icon size={16} aria-hidden="true" />
    </span>
    <span className="neighborhood-row-copy">
      <small>{label}</small>
      <strong>{value}</strong>
      {note && <em>{note}</em>}
    </span>
  </div>
)

const NeighborhoodColumn = ({ city }: { city: City }) => {
  const anchors = useProfileStore((state) => state.anchors[city.id])
  const setAnchor = useProfileStore((state) => state.setAnchor)
  const intel = useCityIntel(city)
  const home = anchors?.home ?? null
  const work = anchors?.work ?? null

  const risk = usePointRiskQuery(home, city.country)
  const commute = useCommuteQuery(
    home ?? { latitude: city.latitude, longitude: city.longitude },
    work,
  )
  const schools = useNearbySchoolsQuery(city)
  const colleges = useNearbyCollegesQuery(city)

  const from: GeoPoint = home ?? {
    label: `${city.name} centre`,
    latitude: city.latitude,
    longitude: city.longitude,
  }

  const allSchools = schools.data
    ? [
        ...schools.data.preK,
        ...schools.data.kindergarten,
        ...schools.data.grades1To6,
        ...schools.data.middleHigh,
      ]
    : []
  // School records carry a city-centre distance; recompute from their own
  // coordinates against the pinned home point so the number means what it says.
  const nearestSchool = allSchools.length
    ? allSchools
        .map((school) => ({
          school,
          miles: Number.isFinite(school.metadata.latitude)
            ? pointDistanceMiles(from, {
                latitude: school.metadata.latitude,
                longitude: school.metadata.longitude,
              })
            : school.distanceMiles,
        }))
        .sort((a, b) => a.miles - b.miles)[0]
    : null

  // College Scorecard records expose a distance from the city centre only.
  const nearestCollege = [...(colleges.data ?? [])].sort(
    (a, b) => a.distanceMiles - b.distanceMiles,
  )[0]
  const route = commute.data?.route ?? null
  const delay = route
    ? trafficDelayPercent(route.travelTimeSeconds, route.freeFlowTimeSeconds)
    : null
  const condition = delay !== null ? trafficCondition(delay) : null

  const centroidRisk = intel?.data.riskScore ?? null
  const pointRisk = risk.data?.score ?? null

  return (
    <div className="neighborhood-column card">
      <div className="neighborhood-head">
        <i style={{ background: city.color }} />
        <div>
          <strong>{city.name}</strong>
          <small>{city.state}</small>
        </div>
      </div>

      <PlacePicker
        label="Home point"
        hint="An address, block, or neighbourhood you would actually live in."
        value={home}
        near={`${city.latitude},${city.longitude}`}
        onChange={(point) => setAnchor(city.id, 'home', point)}
        fallbackLabel="Use city centre"
        onUseFallback={() =>
          setAnchor(city.id, 'home', {
            label: `${city.name} centre`,
            latitude: city.latitude,
            longitude: city.longitude,
          })
        }
      />
      <PlacePicker
        label="Workplace"
        hint="Where you would commute to. Sets the routed commute everywhere in the app."
        value={work}
        near={`${city.latitude},${city.longitude}`}
        onChange={(point) => setAnchor(city.id, 'work', point)}
      />

      <div className="neighborhood-rows">
        {work ? (
          commute.isPending ? (
            <LoadingSpinner size={20} label="Routing your commute" />
          ) : route ? (
            <Row
              icon={Car}
              label="Commute in current traffic"
              value={`${minutes(route.travelTimeSeconds)} min · ${(route.distanceMeters / 1609.344).toFixed(1)} mi`}
              note={
                condition
                  ? `${condition.label} traffic · ${Math.round(delay ?? 0)}% over free-flow · ${route.provider}`
                  : route.provider
              }
              tone={
                minutes(route.travelTimeSeconds) >= 45
                  ? 'alert'
                  : minutes(route.travelTimeSeconds) >= 30
                    ? 'caution'
                    : 'good'
              }
            />
          ) : (
            <Row
              icon={Car}
              label="Commute"
              value="Route unavailable"
              note={commute.data?.routeError ?? 'No route was returned.'}
              tone="caution"
            />
          )
        ) : (
          <Row
            icon={Car}
            label="Commute"
            value="Set a workplace"
            note="Without a workplace, commute shock cannot be measured."
          />
        )}

        <Row
          icon={ShieldAlert}
          label="Hazard risk at this point"
          value={
            risk.isPending && home
              ? 'Loading…'
              : pointRisk !== null
                ? `${Math.round(pointRisk)}/100 · ${risk.data?.rating ?? ''}`.trim()
                : 'Pin a home point'
          }
          note={
            pointRisk !== null && centroidRisk !== null
              ? `Census tract ${risk.data?.tract}. City-centre tract scores ${Math.round(centroidRisk)} — a ${Math.abs(Math.round(pointRisk - centroidRisk))}-point ${pointRisk > centroidRisk ? 'higher' : 'lower'} reading here.`
              : 'FEMA National Risk Index, per census tract.'
          }
          tone={
            pointRisk === null
              ? 'neutral'
              : pointRisk >= 70
                ? 'alert'
                : pointRisk >= 40
                  ? 'caution'
                  : 'good'
          }
        />

        <Row
          icon={Hospital}
          label="Nearest major hospital"
          value={
            intel?.nearestHospital
              ? `${intel.nearestHospital.miles.toFixed(1)} mi`
              : 'Not matched'
          }
          note={intel?.nearestHospital?.name ?? 'HIFLD hospital facilities'}
          tone={
            (intel?.nearestHospital?.miles ?? 99) <= 10
              ? 'good'
              : (intel?.nearestHospital?.miles ?? 99) <= 20
                ? 'caution'
                : 'alert'
          }
        />

        <Row
          icon={School}
          label="Nearest public school"
          value={
            schools.isPending
              ? 'Loading…'
              : nearestSchool
                ? `${nearestSchool.miles.toFixed(1)} mi`
                : 'Not matched'
          }
          note={nearestSchool?.school.name ?? 'NCES Common Core of Data'}
          tone={(nearestSchool?.miles ?? 99) <= 3 ? 'good' : 'caution'}
        />

        <Row
          icon={GraduationCap}
          label="Nearest college"
          value={
            colleges.isPending
              ? 'Loading…'
              : nearestCollege
                ? `${nearestCollege.distanceMiles.toFixed(1)} mi`
                : 'Not matched'
          }
          note={
            nearestCollege
              ? `${nearestCollege.name} · measured from the city centre`
              : 'College Scorecard'
          }
        />

        <Row
          icon={TrainFront}
          label="Transit stops nearby"
          value={
            commute.data
              ? String(commute.data.transit.length)
              : 'Set a workplace'
          }
          note="OpenStreetMap stops along the corridor"
          tone={(commute.data?.transit.length ?? 0) > 0 ? 'good' : 'caution'}
        />

        <Row
          icon={Building2}
          label="Typical housing here"
          value={
            intel
              ? `$${Math.round(intel.data.medianRent).toLocaleString()}/mo rent`
              : '—'
          }
          note={
            intel
              ? `Typical home value $${Math.round(intel.data.medianHomeValue).toLocaleString()}. City-wide, not block-level.`
              : ''
          }
        />
      </div>

      <SourceChip
        source="Commute is a TomTom or OSRM routed trip from your pinned points. Hazard risk is the FEMA tract containing the home point. Housing remains a city-level figure."
        level="Medium"
      />
    </div>
  )
}

export default NeighborhoodColumn
