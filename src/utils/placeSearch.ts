/** Qualify a home-point query without duplicating an already supplied locality. */
export const placeSearchParams = (
  query: string,
  near: string,
  city = '',
  state = '',
) => {
  const parts = query
    .trim()
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  for (const locality of [city.trim(), state.trim()]) {
    if (
      locality &&
      !parts.some((part) => part.toLowerCase() === locality.toLowerCase())
    ) {
      parts.push(locality)
    }
  }
  const params = new URLSearchParams({
    q: parts.join(', '),
    format: 'jsonv2',
    addressdetails: '0',
    limit: '6',
    countrycodes: 'us',
  })
  const coordinates = near.split(',')
  const [lat, lon] = coordinates.map(Number)
  if (
    coordinates.length === 2 &&
    coordinates.every((part) => part.trim()) &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  ) {
    const box = 0.6
    params.set(
      'viewbox',
      `${Math.max(-180, lon - box)},${Math.min(90, lat + box)},${Math.min(180, lon + box)},${Math.max(-90, lat - box)}`,
    )
    // Home searches stay local; workplaces can be in a neighbouring city.
    params.set('bounded', city.trim() ? '1' : '0')
  }
  return params
}
