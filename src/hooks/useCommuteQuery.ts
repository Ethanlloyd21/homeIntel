import { useQuery } from '@tanstack/react-query'
import { fetchCommuteData, type CommutePoint } from 'services/traffic'

export const useCommuteQuery = (
  origin: CommutePoint,
  destination: CommutePoint | null,
) =>
  useQuery({
    queryKey: [
      'commute',
      origin.latitude.toFixed(5),
      origin.longitude.toFixed(5),
      destination?.latitude.toFixed(5),
      destination?.longitude.toFixed(5),
    ],
    enabled: Boolean(destination),
    queryFn: ({ signal }) => fetchCommuteData(origin, destination!, signal),
    staleTime: 2 * 60 * 1000,
  })
