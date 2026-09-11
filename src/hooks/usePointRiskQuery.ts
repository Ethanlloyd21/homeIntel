import { useQuery } from '@tanstack/react-query'
import type { City } from 'data/cities'
import { fetchRiskData } from 'services/risk'
import type { GeoPoint } from 'store/useProfileStore'

/**
 * FEMA's National Risk Index is published per census tract, so a specific home
 * point can score very differently from the city centroid. `fetchRiskData`
 * only reads latitude, longitude and country, so a synthetic city is enough.
 */
export const usePointRiskQuery = (
  point: GeoPoint | null,
  country: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [
      'point-risk',
      point?.latitude.toFixed(4),
      point?.longitude.toFixed(4),
    ],
    enabled: enabled && Boolean(point),
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: ({ signal }) =>
      fetchRiskData(
        {
          latitude: point!.latitude,
          longitude: point!.longitude,
          country,
        } as City,
        signal,
      ),
  })
