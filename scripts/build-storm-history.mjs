import { mkdir, writeFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import {
  csvRows,
  damageDollars,
  addStormEvent,
} from '../src/utils/stormHistory.ts'

const base = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/'
const endYear = new Date().getUTCFullYear() - 1
const startYear = endYear - 4
const listingResponse = await fetch(base)
if (!listingResponse.ok)
  throw new Error(`NOAA index failed: ${listingResponse.status}`)
const listing = await listingResponse.text()
const states = {}
const sources = []
const seen = new Set()
for (let year = startYear; year <= endYear; year++) {
  const pattern = new RegExp(
    `href="(StormEvents_details-ftp_v1\\.0_d${year}_c\\d+\\.csv\\.gz)"`,
    'g',
  )
  const filename = [...listing.matchAll(pattern)]
    .map((m) => m[1])
    .sort()
    .at(-1)
  if (!filename) throw new Error(`Missing NOAA file for ${year}`)
  const response = await fetch(base + filename, {
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) throw new Error(`NOAA download failed: ${response.status}`)
  const rows = csvRows(
    gunzipSync(new Uint8Array(await response.arrayBuffer())).toString('utf8'),
  )
  const header = rows.next().value
  const index = Object.fromEntries(header.map((name, i) => [name, i]))
  let count = 0
  for (const row of rows) {
    const get = (key) => row[index[key]] ?? ''
    const kind = get('CZ_TYPE')
    if (!['C', 'Z'].includes(kind) || seen.has(get('EVENT_ID'))) continue
    seen.add(get('EVENT_ID'))
    const state = get('STATE_FIPS').padStart(2, '0')
    const code = kind + get('CZ_FIPS').padStart(3, '0')
    const areas = (states[state] ??= {})
    const area = (areas[code] ??= {
      name: get('CZ_NAME'),
      kind: kind === 'C' ? 'county' : 'forecast zone',
      count: 0,
      property: 0,
      crop: 0,
      unknownLoss: 0,
      deaths: 0,
      injuries: 0,
      years: {},
      hazards: {},
      recent: [],
      costliest: [],
    })
    const ym = get('BEGIN_YEARMONTH')
    addStormEvent(area, {
      id: get('EVENT_ID'),
      date: `${ym.slice(0, 4)}-${ym.slice(4, 6)}-${get('BEGIN_DAY').padStart(2, '0')}`,
      type: get('EVENT_TYPE'),
      area: get('CZ_NAME'),
      property: damageDollars(get('DAMAGE_PROPERTY')),
      crop: damageDollars(get('DAMAGE_CROPS')),
      deaths:
        Number(get('DEATHS_DIRECT') || 0) + Number(get('DEATHS_INDIRECT') || 0),
      injuries:
        Number(get('INJURIES_DIRECT') || 0) +
        Number(get('INJURIES_INDIRECT') || 0),
      narrative: (get('EVENT_NARRATIVE') || get('EPISODE_NARRATIVE')).slice(
        0,
        900,
      ),
    })
    count++
  }
  sources.push({ year, url: base + filename })
  console.log(`${year}: ${count.toLocaleString()} county/zone event records`)
}
const directory = new URL('../public/data/storm-history/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const [state, areas] of Object.entries(states)) {
  await writeFile(
    new URL(`${state}.json`, directory),
    JSON.stringify({ startYear, endYear, areas }),
  )
}
await writeFile(
  new URL('manifest.json', directory),
  JSON.stringify(
    {
      startYear,
      endYear,
      generatedAt: new Date().toISOString(),
      sources,
      states: Object.keys(states),
      note: 'NOAA Storm Events. Reported nominal property/crop damage; county and forecast-zone events are separate. Missing loss estimates are not zero. Zone boundaries can change over time.',
    },
    null,
    2,
  ),
)
console.log(`Saved ${Object.keys(states).length} state files.`)
