import { useMemo } from 'react'
import type { City } from 'data/cities'
import { useCityIntel, type CityIntel } from 'hooks/useCityIntel'
import { buildCityBrief, type CityBrief } from 'services/cityBrief'
import {
  calculateLifeSimulation,
  type LifeSimulation,
} from 'services/lifeSimulator'
import { assessRegret, type RegretAssessment } from 'services/regret'
import { pointDistanceMiles } from 'services/traffic'
import { useProfileStore } from 'store/useProfileStore'

export type Decision = {
  intel: CityIntel
  originIntel: CityIntel | null
  simulation: LifeSimulation
  originSimulation: LifeSimulation | null
  regret: RegretAssessment
  brief: CityBrief
  supportNetworkMiles: number | null
  /** Monthly cash difference against the origin city. Positive means you keep more. */
  monthlyDelta: number | null
}

/**
 * The full decision for one destination city, measured against the city the
 * household lives in today. Origin data is optional — every downstream engine
 * degrades to a single-city assessment when it is missing.
 */
export const useDecision = (city: City | null): Decision | null => {
  const inputs = useProfileStore((state) => state.inputs)
  const dealBreakers = useProfileStore((state) => state.dealBreakers)
  const weights = useProfileStore((state) => state.weights)
  const originCity = useProfileStore((state) => state.originCity)

  const intel = useCityIntel(city)
  // Researching the city you already live in is a legitimate case: every delta
  // is then genuinely zero, which is a more honest answer than "not measured".
  // The queries dedupe through the React Query cache, so this costs nothing.
  const originIntel = useCityIntel(originCity)

  return useMemo(() => {
    if (!intel || !city) return null

    const simulation = calculateLifeSimulation(
      intel.data,
      inputs,
      dealBreakers,
      weights,
    )
    // The origin is priced with the household's *current* income so the
    // comparison answers "what changes", not "what if I earned the new salary
    // in the old city".
    const originSimulation = originIntel
      ? calculateLifeSimulation(
          originIntel.data,
          { ...inputs, annualIncome: inputs.currentAnnualIncome },
          dealBreakers,
          weights,
        )
      : null

    const supportNetworkMiles = originCity
      ? pointDistanceMiles(
          { latitude: originCity.latitude, longitude: originCity.longitude },
          { latitude: city.latitude, longitude: city.longitude },
        )
      : null

    const regret = assessRegret({
      destination: intel.data,
      destinationSimulation: simulation,
      origin: originIntel?.data ?? null,
      originSimulation,
      destinationClimate: intel.climate,
      originClimate: originIntel?.climate ?? null,
      inputs,
      supportNetworkMiles,
      originCommuteMinutes: originIntel?.commuteMinutes ?? null,
    })

    const brief = buildCityBrief({
      cityName: city.name,
      stateName: city.state,
      destination: intel.data,
      simulation,
      origin: originIntel?.data ?? null,
      originName: originCity?.name ?? null,
      originSimulation,
      climate: intel.climate,
      regret,
      inputs,
      confidenceLevels: intel.confidence.map((entry) => ({
        label: entry.label,
        level: entry.level,
      })),
    })

    return {
      intel,
      originIntel,
      simulation,
      originSimulation,
      regret,
      brief,
      supportNetworkMiles,
      monthlyDelta: originSimulation
        ? originSimulation.disposableIncome === 0 &&
          simulation.disposableIncome === 0
          ? null
          : simulation.disposableIncome - originSimulation.disposableIncome
        : null,
    }
  }, [intel, originIntel, city, originCity, inputs, dealBreakers, weights])
}
