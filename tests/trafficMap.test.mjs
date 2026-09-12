import assert from 'node:assert/strict'
import test from 'node:test'
import {
  trafficDeparture,
  typicalTrafficInstant,
} from '../src/utils/trafficTiming.ts'
import { trafficTilesProxy } from '../server/trafficTilesProxy.ts'
import { fetchCommuteData } from '../src/services/traffic.ts'

test('weekly traffic departures use the selected city date, not the server date', () => {
  const now = new Date('2026-09-13T01:00:00Z')
  assert.equal(
    trafficDeparture(6, '08:30', 'America/Chicago', now),
    '2026-09-19T08:30:00',
  )
  assert.equal(
    trafficDeparture(6, '08:30', 'Asia/Tokyo', now),
    '2026-09-26T08:30:00',
  )
})

test('all weekdays and midnight remain future local departures across year and DST changes', () => {
  assert.equal(
    trafficDeparture(
      0,
      '00:00',
      'America/Chicago',
      new Date('2026-12-28T15:00:00Z'),
    ),
    '2027-01-10T00:00:00',
  )
  assert.equal(
    trafficDeparture(
      1,
      '08:00',
      'America/Chicago',
      new Date('2026-10-30T15:00:00Z'),
    ),
    '2026-11-09T08:00:00',
  )
  for (let day = 0; day < 7; day++) {
    const departure = trafficDeparture(
      day,
      '17:30',
      'America/Chicago',
      new Date('2026-09-12T15:00:00Z'),
    )
    assert.equal(new Date(`${departure}Z`).getUTCDay(), day)
  }
})

test('invalid schedule input is rejected before calling the traffic provider', () => {
  for (const [day, time, zone] of [
    [7, '08:00', 'UTC'],
    [-1, '08:00', 'UTC'],
    [1, '24:00', 'UTC'],
    [1, '08:60', 'UTC'],
    [1, '08:00', 'invalid'],
  ]) {
    assert.throws(() => trafficDeparture(day, time, zone))
  }
})

test('scheduled route requests carry day/time while transit stays independent', async (t) => {
  const urls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    urls.push(new URL(url, 'http://localhost'))
    return Response.json(
      String(url).includes('traffic-route')
        ? { provider: 'TomTom' }
        : { places: [] },
    )
  })
  await fetchCommuteData(
    { latitude: 41, longitude: -87 },
    { latitude: 42, longitude: -88 },
    new AbortController().signal,
    { day: 0, time: '17:30', timeZone: 'America/Chicago' },
  )
  const route = urls.find((url) => url.pathname === '/api/traffic-route')
  const transit = urls.find((url) => url.pathname === '/api/transit-options')
  assert.equal(route.searchParams.get('day'), '0')
  assert.equal(route.searchParams.get('time'), '17:30')
  assert.equal(route.searchParams.get('timeZone'), 'America/Chicago')
  assert.equal(transit.searchParams.has('day'), false)
})

const tileHandler = (key, historicalKey = '') => {
  let handler
  trafficTilesProxy(key, historicalKey).configureServer({
    middlewares: {
      use: (value) => {
        handler = value
      },
    },
  })
  return async (url) => {
    const response = {
      statusCode: 200,
      headers: {},
      setHeader: (name, value) => {
        response.headers[name] = value
      },
      end: (body) => {
        response.body = body
      },
    }
    await handler({ url }, response, () => {
      response.next = true
    })
    return response
  }
}

test('traffic tiles validate coordinates, preserve PNGs, cache refreshes, and keep the key server-side', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls++
    assert.equal(url.host, 'api.tomtom.com')
    assert.equal(url.searchParams.get('key'), 'test-secret')
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { 'content-type': 'image/png' },
    })
  })
  const request = tileHandler('test-secret')
  const result = await request('/api/traffic-tiles/12/1050/1522.png?v=1')
  assert.equal(result.statusCode, 200)
  assert.equal(result.headers['Content-Type'], 'image/png')
  assert.deepEqual([...result.body], [137, 80, 78, 71])
  await request('/api/traffic-tiles/12/1050/1522.png?v=2')
  assert.equal(calls, 1)
  assert.equal((await request('/api/traffic-tiles/2/4/1.png')).statusCode, 400)
  assert.equal((await request('/api/traffic-tiles/99/0/0.png')).statusCode, 400)
  const status = await request('/api/traffic-status')
  assert.deepEqual(JSON.parse(status.body), {
    configured: true,
    typicalConfigured: false,
  })
})

test('missing credentials and upstream errors do not pretend to show clear traffic', async (t) => {
  assert.equal(
    (await tileHandler('')('/api/traffic-tiles/1/0/0.png')).statusCode,
    503,
  )
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('Denied', { status: 403 }),
  )
  const result = await tileHandler('test-secret')(
    '/api/traffic-tiles/1/0/0.png',
  )
  assert.equal(result.statusCode, 502)
  assert.equal(result.headers['Cache-Control'], 'no-store')
})

test('typical traffic exports use the selected local day/time and never return live tiles from cache', async (t) => {
  const urls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    urls.push(url)
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { 'content-type': 'image/png' },
    })
  })
  const request = tileHandler('live-secret', 'historical-secret')
  await request('/api/traffic-tiles/12/1050/1522.png')
  const suffix = '?mode=typical&day=1&time=09%3A00&timeZone=America%2FChicago'
  const result = await request('/api/traffic-tiles/12/1050/1522.png' + suffix)
  assert.equal(result.statusCode, 200)
  assert.equal(urls.length, 2)
  const historical = urls[1]
  assert.equal(historical.host, 'traffic.arcgis.com')
  assert.equal(historical.searchParams.get('layers'), 'show:7')
  const instant = Number(historical.searchParams.get('time'))
  assert.equal(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long',
    }).format(instant),
    'Monday',
  )
  assert.equal(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(instant),
    '09',
  )
  assert.ok(!JSON.stringify(result.headers).includes('historical-secret'))
})

test('unconfigured typical traffic returns unavailable and never substitutes live conditions', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    throw new Error('Should not request a live tile')
  })
  const response = await tileHandler('live-secret')(
    '/api/traffic-tiles/12/1050/1522.png?mode=typical&day=1&time=09%3A00&timeZone=America%2FChicago',
  )
  assert.equal(response.statusCode, 503)
  assert.equal(calls, 0)
})

test('historical map instants preserve local hours through daylight saving transitions', () => {
  const instant = typicalTrafficInstant(
    1,
    '09:00',
    'America/Chicago',
    new Date('2026-10-30T12:00:00Z'),
  )
  assert.equal(new Date(instant).toISOString(), '2026-11-09T15:00:00.000Z')
})
