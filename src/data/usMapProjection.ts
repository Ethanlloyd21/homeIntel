/** Albers equal-area view with separate Alaska and Hawaii insets. */
export const projectUS = (
  longitude: number,
  latitude: number,
): [number, number] | null => {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  const radians = Math.PI / 180
  const albers = (
    lon: number,
    lat: number,
    center: number,
    scale: number,
    x: number,
    y: number,
  ): [number, number] => {
    const n = (Math.sin(29.5 * radians) + Math.sin(45.5 * radians)) / 2
    const c = Math.cos(29.5 * radians) ** 2 + 2 * n * Math.sin(29.5 * radians)
    const rho = Math.sqrt(c - 2 * n * Math.sin(lat * radians)) / n
    const rho0 = Math.sqrt(c - 2 * n * Math.sin(38 * radians)) / n
    const theta = n * (lon - center) * radians
    return [
      x + scale * rho * Math.sin(theta),
      y - scale * (rho0 - rho * Math.cos(theta)),
    ]
  }
  if (latitude > 50 && (longitude < -130 || longitude > 170)) {
    return albers(
      longitude > 0 ? longitude - 360 : longitude,
      latitude,
      -154,
      300,
      155,
      650,
    )
  }
  if (longitude < -154 && longitude > -161 && latitude > 18 && latitude < 23) {
    return [305 + (longitude + 157) * 17, 491 - (latitude - 20) * 17]
  }
  if (longitude < -125 || longitude > -66 || latitude < 24 || latitude > 50)
    return null
  return albers(longitude, latitude, -96, 1080, 490, 275)
}
