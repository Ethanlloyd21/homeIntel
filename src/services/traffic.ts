export type CommutePoint = {
  latitude: number
  longitude: number
}

export type TrafficProfile = {
  time: string
  travelTimeSeconds: number
  freeFlowTimeSeconds: number
}

export type TrafficRoute = {
  provider: 'TomTom' | 'OSRM'
  trafficAvailable: boolean
  distanceMeters: number
  travelTimeSeconds: number
  freeFlowTimeSeconds: number
  trafficDelaySeconds: number
  points: CommutePoint[]
  profiles: TrafficProfile[]
  note: string
}

export type TransitPlace = CommutePoint & {
  id: string
  name: string
  mode: 'Bus' | 'Train' | 'Subway' | 'Tram'
  operator: string
}

export type CommuteData = {
  route: TrafficRoute | null
  transit: TransitPlace[]
  routeError: string | null
  transitError: string | null
}

const routeParams = (origin: CommutePoint, destination: CommutePoint) =>
  new URLSearchParams({
    originLat: String(origin.latitude),
    originLon: String(origin.longitude),
    destinationLat: String(destination.latitude),
    destinationLon: String(destination.longitude),
  })

const responseError = async (response: Response, fallback: string) => {
  const payload = (await response.json().catch(() => null)) as {
    error?: string
  } | null
  return payload?.error ?? fallback
}

export const fetchCommuteData = async (
  origin: CommutePoint,
  destination: CommutePoint,
  signal: AbortSignal,
): Promise<CommuteData> => {
  const params = routeParams(origin, destination)
  const [routeResult, transitResult] = await Promise.allSettled([
    fetch(`/api/traffic-route?${params}`, { signal }).then(async (response) => {
      if (!response.ok)
        throw new Error(await responseError(response, 'Routing unavailable.'))
      return (await response.json()) as TrafficRoute
    }),
    fetch(`/api/transit-options?${params}`, { signal }).then(
      async (response) => {
        if (!response.ok)
          throw new Error(
            await responseError(response, 'Transit information unavailable.'),
          )
        return (await response.json()) as { places: TransitPlace[] }
      },
    ),
  ])

  if (signal.aborted) throw signal.reason
  return {
    route: routeResult.status === 'fulfilled' ? routeResult.value : null,
    transit:
      transitResult.status === 'fulfilled' ? transitResult.value.places : [],
    routeError:
      routeResult.status === 'rejected'
        ? routeResult.reason instanceof Error
          ? routeResult.reason.message
          : 'Routing unavailable.'
        : null,
    transitError:
      transitResult.status === 'rejected'
        ? transitResult.reason instanceof Error
          ? transitResult.reason.message
          : 'Transit information unavailable.'
        : null,
  }
}

export const trafficDelayPercent = (
  travelTimeSeconds: number,
  freeFlowTimeSeconds: number,
) =>
  freeFlowTimeSeconds > 0
    ? Math.max(
        0,
        ((travelTimeSeconds - freeFlowTimeSeconds) / freeFlowTimeSeconds) * 100,
      )
    : 0

export const trafficCondition = (delayPercent: number) => {
  if (delayPercent >= 40) return { label: 'Severe', tone: 'severe' }
  if (delayPercent >= 20) return { label: 'Heavy', tone: 'heavy' }
  if (delayPercent >= 8) return { label: 'Moderate', tone: 'moderate' }
  return { label: 'Light', tone: 'light' }
}

export const distanceMiles = (meters: number) => meters / 1609.344

export const minutes = (seconds: number) =>
  Math.max(0, Math.round(seconds / 60))

export const pointDistanceMiles = (left: CommutePoint, right: CommutePoint) => {
  const radians = (value: number) => (value * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const latitudeDelta = radians(right.latitude - left.latitude)
  const longitudeDelta = radians(right.longitude - left.longitude)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(left.latitude)) *
      Math.cos(radians(right.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
