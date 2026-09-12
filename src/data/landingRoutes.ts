import { cityFromGeocoding } from 'data/cities'

const sanFrancisco = cityFromGeocoding({
  id: 5391959,
  name: 'San Francisco',
  admin1: 'California',
  country: 'United States',
  latitude: 37.7749,
  longitude: -122.4194,
  timezone: 'America/Los_Angeles',
})
const austin = cityFromGeocoding({
  id: 4671654,
  name: 'Austin',
  admin1: 'Texas',
  country: 'United States',
  latitude: 30.2672,
  longitude: -97.7431,
  timezone: 'America/Chicago',
})
const chicago = cityFromGeocoding({
  id: 4887398,
  name: 'Chicago',
  admin1: 'Illinois',
  country: 'United States',
  latitude: 41.85,
  longitude: -87.65,
  timezone: 'America/Chicago',
})
const raleigh = cityFromGeocoding({
  id: 4487042,
  name: 'Raleigh',
  admin1: 'North Carolina',
  country: 'United States',
  latitude: 35.7721,
  longitude: -78.6386,
  timezone: 'America/New_York',
})
const seattle = cityFromGeocoding({
  id: 5809844,
  name: 'Seattle',
  admin1: 'Washington',
  country: 'United States',
  latitude: 47.6062,
  longitude: -122.3321,
  timezone: 'America/Los_Angeles',
})
const denver = cityFromGeocoding({
  id: 5419384,
  name: 'Denver',
  admin1: 'Colorado',
  country: 'United States',
  latitude: 39.7392,
  longitude: -104.9903,
  timezone: 'America/Denver',
})

export const landingRoutes = [
  {
    origin: sanFrancisco,
    destination: austin,
    label: 'San Francisco → Austin',
  },
  { origin: chicago, destination: raleigh, label: 'Chicago → Raleigh' },
  { origin: seattle, destination: denver, label: 'Seattle → Denver' },
]
