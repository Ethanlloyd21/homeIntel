import assert from 'node:assert/strict'
import test from 'node:test'
import { gasPriceGeography, gasPriceProxy } from '../server/gasPriceProxy.ts'

const gasPriceHandler = (key = 'test-secret') => {
  let handler
  gasPriceProxy(key).configureServer({
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

test('gas prices choose the most specific published EIA geography', () => {
  assert.deepEqual(gasPriceGeography('Chicago', 'Illinois'), {
    area: 'CHICAGO',
    label: 'Chicago area',
    scope: 'metro',
  })
  assert.deepEqual(gasPriceGeography('Austin', 'Texas'), {
    area: 'TEXAS',
    label: 'Texas',
    scope: 'state',
  })
  assert.deepEqual(gasPriceGeography('Boston', 'Texas'), {
    area: 'TEXAS',
    label: 'Texas',
    scope: 'state',
  })
  assert.deepEqual(gasPriceGeography('Raleigh', 'North Carolina'), {
    area: 'PADD 1C',
    label: 'Lower Atlantic',
    scope: 'region',
  })
  assert.deepEqual(gasPriceGeography('Spokane', 'WA'), {
    area: 'WASHINGTON',
    label: 'Washington state',
    scope: 'state',
  })
  assert.equal(gasPriceGeography('Toronto', 'Ontario'), null)
})

test('gas price proxy returns regular gasoline without exposing its API key', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.host, 'api.eia.gov')
    assert.equal(url.searchParams.get('api_key'), 'test-secret')
    assert.equal(url.searchParams.get('facets[product][]'), 'EPMR')
    return Response.json({
      response: {
        data: [
          {
            period: '2026-09-07',
            'area-name': 'CHICAGO',
            value: '4.321',
            units: '$/GAL',
          },
          {
            period: '2026-09-07',
            'area-name': 'PADD 2',
            value: '3.894',
            units: '$/GAL',
          },
        ],
      },
    })
  })
  const result = await gasPriceHandler()(
    '/api/gas-price?city=Chicago&state=Illinois',
  )
  assert.equal(result.statusCode, 200)
  const body = JSON.parse(result.body)
  assert.equal(body.price, 4.321)
  assert.equal(body.area, 'Chicago area')
  assert.equal(body.period, '2026-09-07')
  assert.ok(!result.body.includes('test-secret'))
})

test('gas price proxy rejects unsupported places and missing configuration', async () => {
  assert.equal(
    (await gasPriceHandler()('/api/gas-price?city=Toronto&state=Ontario'))
      .statusCode,
    422,
  )
  assert.equal(
    (await gasPriceHandler('')('/api/gas-price?city=Chicago&state=Illinois'))
      .statusCode,
    503,
  )
  assert.equal((await gasPriceHandler()('/api/gas-price')).statusCode, 400)
})
