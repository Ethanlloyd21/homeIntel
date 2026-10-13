import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => new URL(url),
)
assert.equal(
  urls.length,
  9,
  'Sitemap must include the home, directory, methodology, and six city guides.',
)
assert.equal(
  new Set(urls.map(String)).size,
  urls.length,
  'Sitemap contains duplicate URLs.',
)
const titles = new Set()
for (const url of urls) {
  assert.equal(url.origin, 'https://mycityintel.com')
  const html = await readFile(join('dist', url.pathname, 'index.html'), 'utf8')
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
  assert.ok(
    html.includes(`<link rel="canonical" href="${url}"`),
    `Canonical mismatch: ${url}`,
  )
  assert.ok(
    html.includes('content="index,follow,max-image-preview:large"'),
    `Not indexable: ${url}`,
  )
  assert.equal(
    [...html.matchAll(/<h1\b/g)].length,
    1,
    `Expected one visible main heading: ${url}`,
  )
  assert.ok(!html.includes('<div id="root"></div>'), `Empty app shell: ${url}`)
  assert.ok(!/relointel|cityviewintel/i.test(html), `Old branding: ${url}`)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
  assert.equal(
    [...head.matchAll(/<title>/g)].length,
    1,
    `Duplicate title tags: ${url}`,
  )
  assert.equal(
    [...head.matchAll(/rel="canonical"/g)].length,
    1,
    `Duplicate canonicals: ${url}`,
  )
  assert.equal(
    [...head.matchAll(/id="site-schema"/g)].length,
    1,
    `Duplicate structured data blocks: ${url}`,
  )
  assert.ok(title && !titles.has(title), `Missing or duplicate title: ${url}`)
  titles.add(title)
  const schema = JSON.parse(
    html.match(
      /<script id="site-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1] ?? 'null',
  )
  assert.equal(schema?.['@context'], 'https://schema.org')
  assert.ok(
    schema['@graph'].some((node) => node.url === String(url)),
    `Schema URL mismatch: ${url}`,
  )
  for (const [, asset] of html.matchAll(
    /(?:src|href)="(\/assets\/[^"?#]+)"/g,
  )) {
    assert.ok(
      (await stat(join('dist', asset))).isFile(),
      `Missing prerendered asset: ${asset}`,
    )
  }
  for (const [, href] of html.matchAll(/href="(\/[^"?#]*)/g)) {
    if (!href.startsWith('/assets/')) {
      const file = href.endsWith('/')
        ? `${href}index.html`
        : `${href}/index.html`
      assert.ok(
        (await stat(join('dist', file))).isFile(),
        `Broken public/internal link: ${href}`,
      )
    }
  }
}
const rewrites = JSON.parse(
  await readFile('dist/hosting-rewrites.json', 'utf8'),
)
assert.deepEqual(
  rewrites,
  JSON.parse(await readFile('amplify/hosting-rewrites.json', 'utf8')),
)
for (const rule of rewrites.filter((rule) => rule.status === '200')) {
  const html = await readFile(join('dist', rule.target), 'utf8')
  if (!urls.some((url) => url.pathname === rule.source)) {
    assert.ok(
      html.includes('content="noindex,follow"'),
      `Workspace is indexable: ${rule.source}`,
    )
    assert.ok(
      html.includes(
        `<link rel="canonical" href="https://mycityintel.com${rule.source}"`,
      ),
      `Workspace canonical mismatch: ${rule.source}`,
    )
  }
}
assert.deepEqual(rewrites.at(-1), {
  source: '/<*>',
  target: '/404.html',
  status: '404',
})
assert.ok(
  (await readFile('dist/404.html', 'utf8')).includes(
    'content="noindex,follow"',
  ),
)
assert.ok(
  (await readFile('dist/robots.txt', 'utf8')).includes(
    'Sitemap: https://mycityintel.com/sitemap.xml',
  ),
)
assert.ok(
  (await readFile('dist/llms.txt', 'utf8')).includes(
    'https://mycityintel.com/about/',
  ),
)
console.log(
  'SEO checks passed: readable public HTML, unique metadata, valid structured data, working assets/links, noindex workspace shells, sitemap, and hosting routes.',
)
