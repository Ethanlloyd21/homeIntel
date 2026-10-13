# Search and AI discovery

`npm run build` compiles the existing app, prerenders public pages, and runs the
SEO artifact checks. The public HTML and the client use the same React components
and route metadata. No crawler-specific content is served and no additional
runtime service or dependency is required.

## Public pages

- `/`: the existing landing page, with city-guide links below the existing steps.
- `/cities/`: a directory of the six curated city guides.
- `/cities/<city-state>/`: Austin, Chicago, Denver, Raleigh, San Francisco, and Seattle.
- `/about/`: provider links, definitions, dates, calculation limitations, and privacy.

Guides include Zillow ZHVI and ZORI observations from the existing local dataset.
Each figure retains its own observation month; the dataset refresh date is shown
separately. No live provider fetch is required during a build and no source dates
are replaced with the build date. Missing observations remain unavailable.

The first HTML response contains the visible page content, title, description,
self-referencing canonical, Open Graph and Twitter metadata, and JSON-LD WebSite,
WebPage/CollectionPage/AboutPage, and visible breadcrumb definitions. The client
renders the same components, including source notes and limitations. It preserves
the existing landing interactions, theme, and research screens.

The sitemap contains only the nine public pages. Interactive workspace routes have
their own metadata and `noindex,follow`, since they depend on selected cities and
household assumptions. A new browser can open a tool with a city selected:

```text
/housing?city=austin-texas
/life-simulator?city=seattle-washington
```

Other city search results receive links containing their public geocoding identifier,
city label, city-center coordinates, state, country, and timezone. Links contain no
household inputs, origin, shortlist, or home/work addresses. Navigation preserves
the selected destination; browser Back/Forward restores it from the URL. Existing
browser storage keys and household profile migrations remain in place.

## Crawlers and AI systems

The build emits `robots.txt`, `sitemap.xml`, and `llms.txt`. `robots.txt` permits
public crawling and excludes API endpoints; it is not an access-control mechanism.
`llms.txt` is an optional directory and interpretation guide for services that use
it. It does not promise search rankings or AI citations. For Google, crawlable,
useful, indexed content remains the foundation; Google does not require or use
`llms.txt` for its search features. See [Google's AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Hosting and verification

Deploy the frontend build and **replace the existing Amplify Hosting rewrite rules**
with `amplify/hosting-rewrites.json` in **Hosting → Rewrites and redirects**.
The former global SPA rewrite would serve the homepage in place of guide HTML and
can intercept the sitemap. The new rules serve each public page and workspace
shell, normalize trailing slashes, and return the custom 404 for missing paths.
Existing static assets and data files remain directly served. The build produces
an identical `dist/hosting-rewrites.json` and fails if the committed rules drift.
`npm run preview` uses those same rules for HTML pages, redirects, and 404s while
leaving the existing API middleware in control of `/api/*` requests.

When adding a curated guide or changing route definitions, regenerate the frontend
assets, then run `node scripts/prerender.mjs --update-rewrites` and commit the updated
hosting file. A normal `npm run build` validates rather than edits the committed rules.

Checks:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run check:bundle-secrets
npm.cmd run lint -- --ignore-pattern '.npm-cache/**'
```

Tests cover fresh-browser city links, saved-destination precedence, Back/Forward,
reset behavior, malformed URLs, profile preservation, public metadata, and exclusion
of personal inputs from links. The build checks the actual HTML for unique titles,
canonicals, headings, JSON-LD, existing assets and internal links, noindex workspace
shells, 404 handling, and discovery files.

After deployment, verify the domain in Google Search Console and submit
`https://mycityintel.com/sitemap.xml`. Inspect the homepage and a guide using URL
Inspection, and check their raw HTML plus `/robots.txt`, `/sitemap.xml`, and a missing
city-guide URL. These account and hosting checks are not performed by a local build.
