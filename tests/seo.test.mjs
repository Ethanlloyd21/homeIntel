import assert from 'node:assert/strict'
import test from 'node:test'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const aliases = Object.fromEntries(
  ['data', 'utils', 'store'].map((name) => [name, resolve('src', name)]),
)
const bundle = async (contents) => {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    alias: aliases,
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  })
  return `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
}
const routes = await import(
  await bundle(
    "export * from 'utils/routes'; export * from 'utils/seo'; export * from 'data/publicCities'; export * from 'data/cities'",
  )
)
const storeModule = await bundle(
  "export { useAppStore } from 'store/useAppStore'",
)
let importId = 0

const withBrowser = async (pathname, search, entries, run) => {
  const originals = Object.fromEntries(
    ['window', 'document', 'localStorage'].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  )
  const values = new Map(entries)
  const location = { pathname, search }
  const browser = {
    location,
    matchMedia: () => ({ matches: false }),
    history: {
      pushState: (_state, _unused, path) => {
        const url = new URL(path, 'https://mycityintel.com')
        location.pathname = url.pathname
        location.search = url.search
      },
    },
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: browser,
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement: { dataset: {}, style: {} } },
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  })
  try {
    const { useAppStore } = await import(`${storeModule}#${++importId}`)
    await run(useAppStore, browser, values)
  } finally {
    for (const [name, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  }
}

test('every public city link opens its city without browser storage', async () => {
  for (const city of routes.publicCities) {
    await withBrowser('/housing', `?city=${city.slug}`, [], async (store) => {
      assert.equal(store.getState().city.id, String(city.id))
      assert.equal(store.getState().view, 'Housing')
    })
  }
})

test('shared city takes precedence over saved destination without replacing household data', async () => {
  const prior = routes.cityFromGeocoding(routes.publicCities[1])
  const household = '{"income":123456,"shortlist":["keep-me"]}'
  await withBrowser(
    '/overview',
    '?city=austin-texas',
    [
      [
        'homeintel-selected-cities',
        JSON.stringify({ city: prior, comparisonCity: prior }),
      ],
      ['homeintel-profile', household],
    ],
    async (store, browser, values) => {
      assert.equal(store.getState().city.name, 'Austin')
      assert.equal(store.getState().comparisonCity.name, 'Chicago')
      store.getState().setView('Environment')
      assert.equal(browser.location.pathname, '/environment')
      assert.equal(browser.location.search, '?city=austin-texas')
      browser.location.pathname = '/housing'
      browser.location.search = '?city=seattle-washington'
      store.getState().syncLocation()
      assert.equal(store.getState().city.name, 'Seattle')
      assert.equal(store.getState().view, 'Housing')
      store.getState().resetSelection()
      assert.equal(browser.location.pathname, '/')
      assert.equal(browser.location.search, '')
      assert.equal(store.getState().city, null)
      assert.equal(values.get('homeintel-profile'), household)
    },
  )
})

test('arbitrary searched cities round-trip and links exclude personal inputs', () => {
  const city = routes.cityFromGeocoding({
    id: 4407066,
    name: 'Springfield',
    admin1: 'Missouri',
    country: 'United States',
    latitude: 37.2153,
    longitude: -93.2982,
    timezone: 'America/Chicago',
  })
  const link = routes.workspacePath('Brief', {
    ...city,
    annualIncome: 999999,
    homeAddress: 'private address',
  })
  const parsed = routes.cityFromSearch(
    new URL(link, 'https://mycityintel.com').search,
  )
  assert.equal(parsed.name, city.name)
  assert.equal(parsed.admin1, city.state)
  assert.equal(parsed.latitude, city.latitude)
  assert.equal(parsed.timezone, city.timezone)
  assert.ok(!/annualIncome|999999|homeAddress|private/.test(link))
})

test('malformed city queries are rejected instead of crashing or changing the destination', async () => {
  for (const query of [
    '?city=unknown',
    '?city=1&name=Bad&state=Texas&country=United+States&lat=NaN&lon=1',
    '?city=1&name=Bad&state=Texas&country=United+States&lat=91&lon=1',
    '?city=1&name=Bad&state=Texas&country=United+States&lat=30&lon=1&tz=invalid',
    '?city=1&name=Bad&state=Texas&country=United+States&lat=&lon=',
  ])
    assert.equal(routes.cityFromSearch(query), null)
  await withBrowser('/overview', '?city=invalid', [], async (store) =>
    assert.equal(store.getState().city, null),
  )
})

test('public metadata is unique and private workspace metadata is noindex', () => {
  const paths = [
    '/',
    '/cities/',
    '/about/',
    ...routes.publicCities.map(routes.cityGuidePath),
  ]
  const titles = new Set()
  for (const path of paths) {
    const meta = routes.metadataForPath(path)
    assert.equal(meta.index, true)
    assert.equal(meta.canonical, `https://mycityintel.com${path}`)
    assert.ok(!titles.has(meta.title))
    titles.add(meta.title)
    const graph = routes.structuredDataForPath(path)['@graph']
    assert.ok(graph.some((node) => node.url === meta.canonical))
    if (path.startsWith('/cities/') && path !== '/cities/')
      assert.ok(
        graph.some(
          (node) =>
            node['@type'] === 'BreadcrumbList' &&
            node.itemListElement.length === 3,
        ),
      )
  }
  for (const path of [
    ...Object.values(routes.viewPaths),
    '/cities/nonexistent/',
    '/unknown',
  ]) {
    assert.equal(routes.metadataForPath(path).index, false)
    assert.notEqual(
      routes.metadataForPath(path).canonical,
      'https://mycityintel.com/',
    )
  }
})
