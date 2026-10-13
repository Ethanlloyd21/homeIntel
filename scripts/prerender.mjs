import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve, dirname, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, stop } from 'esbuild'
import { loadEnv } from 'vite'

// Compile the shared React components for Node without changing the browser build.
const output = resolve('.npm-cache/prerender/render.mjs')
await mkdir(dirname(output), { recursive: true })
const env = loadEnv('production', process.cwd(), 'VITE_')
await build({
  entryPoints: ['src/seo/render.tsx'],
  outfile: output,
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  jsx: 'automatic',
  alias: {
    ...Object.fromEntries(
      [
        'components',
        'pages',
        'data',
        'utils',
        'services',
        'store',
        'hooks',
      ].map((name) => [name, resolve('src', name)]),
    ),
    '#api': resolve('src/utils/api.ts'),
  },
  define: {
    'import.meta.env.BASE_URL': JSON.stringify('/'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_KOFI_URL': JSON.stringify(env.VITE_KOFI_URL || ''),
  },
  plugins: [
    {
      name: 'server-asset-url',
      setup: (builder) => {
        builder.onResolve({ filter: /^\/assets\// }, (args) => ({
          path: resolve(args.path.slice(1)),
        }))
        builder.onLoad({ filter: /\.svg$/ }, (args) => ({
          contents:
            'export default ' +
            JSON.stringify(
              '/' + relative(process.cwd(), args.path).replaceAll('\\', '/'),
            ),
          loader: 'js',
        }))
      },
    },
  ],
})
const escapeHtml = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
const jsonScript = (data) => JSON.stringify(data).replaceAll('<', '\\u003c')

try {
  const {
    renderPage,
    metadataForPath,
    structuredDataForPath,
    publicPaths,
    workspacePaths,
    siteUrl,
    publicCities,
  } = await import(pathToFileURL(output).href)
  const zillow = JSON.parse(
    await readFile('public/data/zillow-market.json', 'utf8'),
  )
  const data = {
    updatedAt: zillow.updatedAt,
    markets: zillow.markets
      .filter((market) =>
        publicCities.some(
          (city) =>
            city.name.toLowerCase() === market.city.toLowerCase() &&
            city.stateCode === market.state,
        ),
      )
      .map(({ city, state, homeValue, homeValueDate, rent, rentDate }) => ({
        city,
        state,
        homeValue,
        homeValueDate,
        rent,
        rentDate,
      })),
  }
  let template = await readFile('dist/index.html', 'utf8')
  const templateFile = resolve('.npm-cache/prerender/client-template.html')
  if (template.includes('<div id="root"></div>')) {
    await writeFile(templateFile, template)
  } else {
    // Keep reruns idempotent; never embed the previous homepage inside every guide.
    const cached = await readFile(templateFile, 'utf8')
    const script = (html) => html.match(/<script\b[^>]*src="([^"]+)"/)?.[1]
    if (!script(cached) || script(cached) !== script(template))
      throw new Error(
        'Prerender template is stale. Regenerate the Vite frontend assets first.',
      )
    template = cached
  }
  const favicon = template.match(
    /<link\b(?=[^>]*\brel="icon")[^>]*\bhref="([^"]+)"/,
  )?.[1]
  if (!favicon) throw new Error('Production favicon is missing.')
  const writePage = async (pathname, target) => {
    const meta = metadataForPath(pathname)
    const body = renderPage(pathname, data).replaceAll(
      '/assets/images/mycityicon.svg',
      favicon,
    )
    // All SEO tags come from the same route definitions as the client.
    const clean = template
      .replace(/<title>[\s\S]*?<\/title>/g, '')
      .replace(
        /<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,
        '',
      )
      .replace(/<link\b[^>]*rel="canonical"[^>]*>/g, '')
    const tags = `<title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="${meta.index ? 'index,follow,max-image-preview:large' : 'noindex,follow'}" />
    <link rel="canonical" href="${meta.canonical}" />
    <meta property="og:site_name" content="MyCityIntel" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${meta.canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <script id="site-schema" type="application/ld+json">${jsonScript(structuredDataForPath(pathname))}</script>
    <script id="public-page-data" type="application/json">${jsonScript(data)}</script>`
    const html = clean
      .replace('</head>', `${tags}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    await mkdir(join('dist', target, '..'), { recursive: true })
    await writeFile(join('dist', target), html)
  }
  for (const pathname of publicPaths)
    await writePage(
      pathname,
      pathname === '/' ? 'index.html' : `${pathname.slice(1)}index.html`,
    )
  for (const pathname of workspacePaths)
    await writePage(pathname, `${pathname.slice(1)}/index.html`)
  await writePage('/404.html', '404.html')
  await writeFile(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')}\n</urlset>\n`,
  )
  await writeFile(
    'dist/robots.txt',
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  )
  await writeFile(
    'dist/llms.txt',
    `# MyCityIntel\n\n> Public U.S. city research and relocation planning tools.\n\n## Public resources\n\n- [City guides](${siteUrl}/cities/): dated city housing snapshots and research links.\n- [Data and methodology](${siteUrl}/about/): sources, geography, observation dates, estimation limits, and privacy.\n${publicCities.map((city) => `- [${city.name}, ${city.admin1}](${siteUrl}/cities/${city.slug}/): housing snapshot and city research guide.`).join('\n')}\n\n## Interpreting the data\n\nPublic housing values are Zillow Research city indices with observation dates. They are not listings, neighborhood quotes, or personal budgets. Cite the specific city guide and observation period. The interactive workspace depends on user assumptions and is not a published city ranking. Missing data is not zero. Household inputs stay in browser storage and are not part of public guides.\n`,
  )
  // Exact public/workspace rules take precedence over unknown-path 404s.
  const rewrites = publicPaths
    .filter((path) => path !== '/')
    .flatMap((path) => [
      { source: path.slice(0, -1), target: path, status: '301' },
      { source: path, target: `${path}index.html`, status: '200' },
    ])
  for (const path of workspacePaths)
    rewrites.push(
      { source: `${path}/`, target: path, status: '301' },
      { source: path, target: `${path}/index.html`, status: '200' },
    )
  rewrites.push({ source: '/<*>', target: '/404.html', status: '404' })
  await writeFile(
    'dist/hosting-rewrites.json',
    `${JSON.stringify(rewrites, null, 2)}\n`,
  )
  if (process.argv.includes('--update-rewrites'))
    await writeFile(
      'amplify/hosting-rewrites.json',
      `${JSON.stringify(rewrites, null, 2)}\n`,
    )
  const committedRules = JSON.parse(
    await readFile('amplify/hosting-rewrites.json', 'utf8'),
  )
  if (JSON.stringify(committedRules) !== JSON.stringify(rewrites))
    throw new Error(
      'Amplify rewrite rules do not match the generated routes. Update amplify/hosting-rewrites.json before deploying.',
    )
  console.log(
    `Prerendered ${publicPaths.length} public pages, ${workspacePaths.length} workspace shells, and a 404 page. Generated sitemap, robots.txt, and llms.txt.`,
  )
} finally {
  stop()
}
