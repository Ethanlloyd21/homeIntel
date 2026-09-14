import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import {
  buildWeatherOutlook,
  fetchWeatherDaily,
  mergeWeatherHistory,
  weatherOutlookRequests,
} from '../src/services/weatherOutlook.ts'

const city = { latitude: 41.85, longitude: -87.65, timezone: 'America/Chicago' }
const daily = (date, high = 70) => ({
  time: [date],
  temperature_2m_max: [high],
  temperature_2m_min: [40],
  precipitation_sum: [null],
})

test('archive requests stay within a year, share completed-year cache keys, and handle early January', () => {
  const first = weatherOutlookRequests(city, '2026-09-14')
  const next = weatherOutlookRequests(city, '2026-09-15')
  assert.equal(first.history.length, 11)
  assert.equal(first.history[0].year, 2026)
  assert.equal(first.history[1].url, next.history[1].url)
  assert.notEqual(first.history[0].url, next.history[0].url)
  for (const request of weatherOutlookRequests(city, '2026-01-02').history) {
    const params = new URL(request.url).searchParams
    assert.ok(params.get('start_date') <= params.get('end_date'))
    assert.equal(
      params.get('start_date').slice(0, 4),
      params.get('end_date').slice(0, 4),
    )
    assert.ok(params.get('end_date') <= '2025-12-26')
  }
})

test('a failed archive still allows the forecast calendar to render', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) =>
    String(url).includes('archive')
      ? new Response('', { status: 503 })
      : Response.json({ daily: daily('2026-09-14', 81) }),
  )
  const signal = new AbortController().signal
  const results = await Promise.allSettled([
    fetchWeatherDaily('https://archive.test', signal, true),
    fetchWeatherDaily('https://forecast.test', signal),
  ])
  assert.equal(results[0].status, 'rejected')
  const outlook = buildWeatherOutlook(
    mergeWeatherHistory([]),
    results[1].value,
    '2026-09-14',
  )
  assert.equal(outlook.months[8].days[13].source, 'forecast')
  assert.equal(outlook.months[8].days[13].high, 81)
  assert.equal(outlook.months[9].days[0].source, 'unavailable')
  assert.equal(outlook.historicalYears, 0)
})

test('year chunks merge chronologically without losing alignment or inventing rainfall', () => {
  const merged = mergeWeatherHistory([
    daily('2025-06-01', 85),
    daily('2024-06-01', 75),
  ])
  assert.deepEqual(merged.time, ['2024-06-01', '2025-06-01'])
  assert.deepEqual(merged.temperature_2m_max, [75, 85])
  assert.deepEqual(merged.relative_humidity_2m_mean, [null, null])
  assert.deepEqual(merged.precipitation_sum, [null, null])
})

test('weather errors distinguish rate limits, empty records, and timeouts', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        'Unexpected error while streaming data: allEndpointsUnavailable',
        { status: 200 },
      ),
  )
  await assert.rejects(
    fetchWeatherDaily('https://weather.test', new AbortController().signal),
    /incomplete weather response/,
  )
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('', { status: 429 }),
  )
  await assert.rejects(
    fetchWeatherDaily('https://weather.test', new AbortController().signal),
    /limiting weather requests/,
  )
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ daily: daily('2026-09-14', null) }),
  )
  await assert.rejects(
    fetchWeatherDaily('https://weather.test', new AbortController().signal),
    /no usable weather/,
  )
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => {
    await delay(100, undefined, { signal })
    return Response.json({ daily: daily('2026-09-14') })
  })
  await assert.rejects(
    fetchWeatherDaily(
      'https://weather.test',
      new AbortController().signal,
      true,
      5,
    ),
    /timed out/,
  )
})

test('archive concurrency is bounded and cancelled queued requests do not fetch', async (t) => {
  let active = 0,
    peak = 0
  const urls = []
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => {
    urls.push(url)
    active++
    peak = Math.max(peak, active)
    try {
      await delay(10, undefined, { signal })
      return Response.json({ daily: daily('2025-06-01') })
    } finally {
      active--
    }
  })
  const cancel = new AbortController()
  const requests = [
    fetchWeatherDaily('first', new AbortController().signal, true),
    fetchWeatherDaily('second', new AbortController().signal, true),
    fetchWeatherDaily('cancelled', cancel.signal, true),
    fetchWeatherDaily('fourth', new AbortController().signal, true),
  ]
  cancel.abort()
  const results = await Promise.allSettled(requests)
  assert.equal(peak, 2)
  assert.equal(results[2].status, 'rejected')
  assert.equal(results[3].status, 'fulfilled')
  assert.ok(!urls.includes('cancelled'))
})
