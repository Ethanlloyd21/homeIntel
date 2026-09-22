import assert from 'node:assert/strict'
import test from 'node:test'
import { createApiPlugins } from '../server/apiPlugins.ts'
import { createLambdaHandler } from '../server/lambdaAdapter.ts'

const event = (path, query = '', method = 'GET') => ({
  rawPath: path,
  rawQueryString: query,
  requestContext: { http: { method } },
})

test('Lambda preserves route validation, missing-key responses, and 404s', async () => {
  const handle = createLambdaHandler(createApiPlugins({}))
  assert.equal(
    (await handle(event('/api/fbi-crime', 'state=BAD'))).statusCode,
    400,
  )
  assert.equal(
    (await handle(event('/api/fbi-crime', 'state=IL'))).statusCode,
    503,
  )
  assert.equal(
    (await handle(event('/api/census/2024/acs/acs5'))).statusCode,
    503,
  )
  assert.equal(
    (await handle(event('/api/census/https://evil.example'))).statusCode,
    400,
  )
  assert.equal((await handle(event('/api/missing'))).statusCode, 404)
  assert.equal(
    (await handle(event('/api/traffic-status', '', 'POST'))).statusCode,
    405,
  )
  const status = await handle(event('/api/traffic-status'))
  assert.deepEqual(JSON.parse(status.body), {
    configured: false,
    typicalConfigured: false,
  })
})

test('Lambda preserves binary bytes and response headers', async () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 0, 255, 128])
  const handle = createLambdaHandler([
    {
      name: 'binary-test',
      configureServer: (server) =>
        server.middlewares.use((_request, response) => {
          response.setHeader('Content-Type', 'image/png')
          response.setHeader('Cache-Control', 'public, max-age=120')
          response.end(bytes)
        }),
    },
  ])
  const result = await handle(event('/api/traffic-tiles/1/0/0.png'))
  assert.equal(result.isBase64Encoded, true)
  assert.equal(result.headers['content-type'], 'image/png')
  assert.deepEqual(Buffer.from(result.body, 'base64'), Buffer.from(bytes))
})

test('Census proxy adds the server key, ignores client keys, and hides upstream errors', async () => {
  const originalFetch = globalThis.fetch
  const handle = createLambdaHandler(
    createApiPlugins({ CENSUS_API_KEY: 'server-test-secret' }),
  )
  let called
  try {
    globalThis.fetch = async (input) => {
      called = new URL(input)
      return new Response(JSON.stringify([['NAME'], ['Chicago']]))
    }
    const result = await handle(
      event(
        '/api/census/2024/acs/acs5',
        'get=NAME&for=place:*&in=state:17&key=attacker',
      ),
    )
    assert.equal(result.statusCode, 200)
    assert.equal(called.origin, 'https://api.census.gov')
    assert.equal(called.searchParams.get('key'), 'server-test-secret')
    assert.equal(called.searchParams.get('in'), 'state:17')
    assert.ok(!result.body.includes('server-test-secret'))
    globalThis.fetch = async () =>
      new Response('server-test-secret', { status: 403 })
    const failure = await handle(event('/api/census/2024/acs/acs5', 'get=NAME'))
    assert.equal(failure.statusCode, 502)
    assert.ok(!failure.body.includes('server-test-secret'))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Lambda does not disclose unexpected handler errors', async () => {
  const handle = createLambdaHandler([
    {
      name: 'failure-test',
      configureServer: (server) =>
        server.middlewares.use(() => {
          throw new Error('private-key')
        }),
    },
  ])
  const result = await handle(event('/api/example'))
  assert.equal(result.statusCode, 502)
  assert.ok(!result.body.includes('private-key'))
})
