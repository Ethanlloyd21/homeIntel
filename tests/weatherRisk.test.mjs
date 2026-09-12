import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  buildWeatherOutlook,
  localDate,
} from '../src/services/weatherOutlook.ts'
import {
  addStormEvent,
  csvRows,
  damageDollars,
} from '../src/utils/stormHistory.ts'
import { fetchRiskData } from '../src/services/risk.ts'

const historyFixture = () => {
  const data = {
    time: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    precipitation_sum: [],
    relative_humidity_2m_mean: [],
    snowfall_sum: [],
    wind_gusts_10m_max: [],
  }
  for (let year = 2023; year <= 2025; year++)
    for (let month = 0; month < 12; month++)
      for (
        let day = 1;
        day <= new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        day++
      ) {
        data.time.push(
          `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        )
        data.temperature_2m_max.push(60)
        data.temperature_2m_min.push(40)
        data.precipitation_sum.push(day % 2 ? 0 : 0.1)
        data.relative_humidity_2m_mean.push(65)
        data.snowfall_sum.push(0)
        data.wind_gusts_10m_max.push(20)
      }
  return data
}
test('all October–December dates receive labeled historical expectations, not invented daily forecasts', () => {
  const outlook = buildWeatherOutlook(historyFixture(), undefined, '2026-09-12')
  const days = outlook.months.slice(9).flatMap((m) => m.days)
  assert.equal(days.length, 92)
  assert.ok(
    days.every(
      (d) =>
        d.source === 'typical' &&
        d.high === 60 &&
        d.low === 40 &&
        d.weatherCode === null &&
        d.samples >= 30,
    ),
  )
  assert.equal(outlook.climate[0].humidity, 65)
  assert.equal(outlook.climate[0].freezeDays, 0)
})
test('forecasts take priority over climate expectations while null rainfall stays missing', () => {
  const forecast = {
    time: ['2026-09-12'],
    temperature_2m_max: [81],
    temperature_2m_min: [51],
    precipitation_sum: [null],
    weather_code: [0],
  }
  const day = buildWeatherOutlook(historyFixture(), forecast, '2026-09-12')
    .months[8].days[11]
  assert.equal(day.high, 81)
  assert.equal(day.source, 'forecast')
  assert.equal(day.precipitation, null)
})
test('short climate history is not presented as a reliable daily expectation', () => {
  const history = historyFixture()
  history.time = history.time.map((d) => d.replace(/^202[345]/, '2025'))
  assert.equal(
    buildWeatherOutlook(history, undefined, '2026-09-12').months[9].days[0]
      .source,
    'unavailable',
  )
})
test('city dates handle time zones and climate smoothing wraps the year', () => {
  assert.equal(
    localDate('America/Chicago', new Date('2026-01-01T01:00:00Z')),
    '2025-12-31',
  )
  const outlook = buildWeatherOutlook(historyFixture(), undefined, '2026-09-12')
  assert.equal(outlook.months[0].days[0].samples, 45)
  assert.equal(outlook.months[11].days[30].samples, 45)
})
test('NOAA CSV handles embedded commas, quotes, and newlines; damage distinguishes missing from zero', () => {
  assert.deepEqual(
    [...csvRows('ID,TEXT\n1,"rain, hail\nand ""wind"""\n')],
    [
      ['ID', 'TEXT'],
      ['1', 'rain, hail\nand "wind"'],
    ],
  )
  assert.equal(damageDollars('2.5M'), 2500000)
  assert.equal(damageDollars('3K'), 3000)
  assert.equal(damageDollars('1B'), 1e9)
  assert.equal(damageDollars('0.00K'), 0)
  assert.equal(damageDollars(''), null)
  assert.equal(damageDollars('Unknown'), null)
})
test('NOAA loss totals reconcile by year and hazard, and report missing values', () => {
  const area = {
    name: 'Example',
    kind: 'county',
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
  }
  addStormEvent(area, {
    id: '1',
    date: '2025-05-01',
    type: 'Hail',
    area: 'Example',
    property: 1000,
    crop: null,
    deaths: 0,
    injuries: 0,
    narrative: '',
  })
  addStormEvent(area, {
    id: '2',
    date: '2025-06-01',
    type: 'Flood',
    area: 'Example',
    property: 2000,
    crop: 500,
    deaths: 0,
    injuries: 1,
    narrative: '',
  })
  assert.equal(area.property + area.crop, 3500)
  assert.equal(area.unknownLoss, 1)
  assert.equal(area.years['2025'].property, 3000)
  assert.equal(area.hazards.Hail.months[4], 1)
  assert.equal(area.costliest[0].id, '2')
})
test('generated NOAA county data is internally consistent and county/zone records remain separate', () => {
  const data = JSON.parse(
    readFileSync(
      new URL('../public/data/storm-history/17.json', import.meta.url),
      'utf8',
    ),
  )
  const county = data.areas.C031,
    zone = data.areas.Z104
  assert.equal(county.kind, 'county')
  assert.equal(zone.kind, 'forecast zone')
  assert.equal(
    county.count,
    Object.values(county.years).reduce((sum, y) => sum + y.count, 0),
  )
  assert.ok(
    Math.abs(
      county.property -
        Object.values(county.hazards).reduce((sum, h) => sum + h.property, 0),
    ) < 0.01,
  )
  assert.equal(data.startYear, 2021)
  assert.equal(data.endYear, 2025)
})
test('FEMA requests omit nonexistent drought building fields and preserve missing or zero values', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const fields = new URL(url).searchParams.get('outFields').split(',')
    assert.ok(!fields.includes('DRGT_EALB'))
    assert.ok(!fields.includes('DRGT_HLRB'))
    return Response.json({
      features: [
        {
          attributes: {
            EAL_SCORE: 40,
            EAL_RATNG: 'Relatively Low',
            EAL_VALT: 1234,
            EAL_VALB: 0,
            RESL_SCORE: -9999,
            STCOFIPS: '17031',
            COUNTY: 'Cook',
            HAIL_EALS: 50,
            HAIL_EALB: 0,
            HAIL_EALT: 5,
          },
        },
      ],
    })
  })
  const data = await fetchRiskData(
    { latitude: 41, longitude: -87, country: 'United States' },
    new AbortController().signal,
  )
  assert.equal(data.score, 40)
  assert.equal(data.resilienceScore, null)
  assert.equal(data.buildingLoss, 0)
  assert.equal(data.agricultureLoss, null)
  assert.equal(data.hazards[0].buildingLoss, 0)
})
