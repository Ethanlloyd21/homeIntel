import Brand from 'components/Brand'
import { useQuery } from '@tanstack/react-query'
import PublicResearchLinks from 'components/PublicResearchLinks'
import { cityGuidePath, publicCities, type PublicData } from 'data/publicCities'
import { publicPageAt } from 'utils/seo'

const money = (value?: number) =>
  value && Number.isFinite(value) && value > 0
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    : 'Not available'
const date = (value?: string) =>
  value
    ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'Date unavailable'

const Sources = () => (
  <ul className="public-source-list">
    <li>
      <a href="https://www.zillow.com/research/data/">Zillow Research</a>: city
      home-value and rent indices.
    </li>
    <li>
      <a href="https://www.census.gov/programs-surveys/acs">
        U.S. Census American Community Survey
      </a>
      : household, income, education, and housing context.
    </li>
    <li>
      <a href="https://www.bls.gov/lau/">Bureau of Labor Statistics</a>:
      reported local unemployment and employment data.
    </li>
    <li>
      <a href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area">
        Bureau of Economic Analysis
      </a>
      : regional price levels.
    </li>
    <li>
      <a href="https://hazards.fema.gov/nri/">FEMA National Risk Index</a>:
      modeled natural-hazard risk.
    </li>
    <li>
      <a href="https://open-meteo.com/">Open-Meteo</a>: weather forecasts and
      historical climate data.
    </li>
    <li>
      <a href="https://nces.ed.gov/">
        National Center for Education Statistics
      </a>
      : schools and colleges.
    </li>
  </ul>
)

const PublicPage = ({
  pathname,
  data,
}: {
  pathname: string
  data: PublicData
}) => {
  const snapshot =
    useQuery({
      queryKey: ['public-guide-markets'],
      initialData: data.markets.length ? data : undefined,
      queryFn: async ({ signal }): Promise<PublicData> => {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/zillow-market.json`,
          { signal },
        )
        if (!response.ok) throw new Error('Housing snapshot unavailable')
        return response.json()
      },
      staleTime: 24 * 60 * 60 * 1000,
    }).data ?? data
  const page = publicPageAt(pathname)
  const city = page?.kind === 'city' ? page.city : null
  const market = city
    ? snapshot.markets.find(
        (item) =>
          item.city.toLowerCase() === city.name.toLowerCase() &&
          item.state === city.stateCode,
      )
    : null
  const appLink = city ? `/overview?city=${city.slug}` : '/'
  return (
    <div className="app-shell location-entry public-site">
      <main>
        <header className="public-header">
          <a href="/" aria-label="MyCityIntel home">
            <Brand />
          </a>
          <nav aria-label="Public pages">
            <a href="/cities/">City guides</a>
            <a href="/about/">Our data</a>
            <a href={appLink}>Open research tools</a>
          </nav>
        </header>
        <article className="public-page">
          <nav className="public-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a> /{' '}
            {city ? (
              <>
                <a href="/cities/">City guides</a> / {city.name}
              </>
            ) : page?.kind === 'directory' ? (
              'City guides'
            ) : page?.kind === 'about' ? (
              'Data and methodology'
            ) : (
              'Page not found'
            )}
          </nav>
          {city ? (
            <>
              <p className="eyebrow">CITY RESEARCH GUIDE</p>
              <h1>
                Moving to {city.name}, {city.admin1}
              </h1>
              <p className="public-lead">
                Start with the city’s housing market, then check whether the
                costs, work, climate, and everyday life fit your household.
              </p>
              <a className="public-cta" href={appLink}>
                Research {city.name} in the app →
              </a>
              <section aria-labelledby="housing-snapshot">
                <h2 id="housing-snapshot">{city.name} housing snapshot</h2>
                <p>
                  These are dated city market indices from Zillow Research. They
                  are not listing prices, a quote for a particular home, or a
                  household budget.
                </p>
                <dl className="public-metrics">
                  <div>
                    <dt>Typical home value</dt>
                    <dd>{money(market?.homeValue)}</dd>
                    <small>{date(market?.homeValueDate)} · Zillow ZHVI</small>
                  </div>
                  <div>
                    <dt>Typical monthly rent</dt>
                    <dd>{money(market?.rent)}</dd>
                    <small>{date(market?.rentDate)} · Zillow ZORI</small>
                  </div>
                </dl>
                <p className="public-note">
                  Source:{' '}
                  <a href="https://www.zillow.com/research/data/">
                    Zillow Research data and methodology
                  </a>
                  . Local dataset refreshed {date(snapshot.updatedAt)}. Newer
                  observations may be available from the provider.
                </p>
                <h3>How to use these figures</h3>
                <p>
                  The Zillow Home Value Index (ZHVI) describes typical home
                  values; the Zillow Observed Rent Index (ZORI) describes
                  typical market rents. They describe different markets and may
                  cover different periods. Neither is a Census median or an
                  estimate of a specific neighborhood.
                </p>
                <p>
                  For a rental move to {city.name}, compare the rent index with
                  actual listings and add utilities, transport, childcare,
                  healthcare, and debt payments. For a purchase, include your
                  down payment, interest rate, insurance, maintenance, and
                  property taxes rather than treating the home-value index as
                  your mortgage budget.
                </p>
              </section>
              <section>
                <h2>Research the trade-offs in {city.name}</h2>
                <ul className="public-tool-list">
                  <li>
                    <a href={`/housing?city=${city.slug}`}>Housing trends</a> —
                    compare dated market observations and Census housing
                    context.
                  </li>
                  <li>
                    <a href={`/employment?city=${city.slug}`}>
                      Jobs and the local economy
                    </a>{' '}
                    — check industry fit, reported unemployment, and major
                    employers.
                  </li>
                  <li>
                    <a href={`/environment?city=${city.slug}`}>
                      Climate and weather
                    </a>{' '}
                    — examine seasonal comfort and historical conditions.
                  </li>
                  <li>
                    <a href={`/risk?city=${city.slug}`}>Risk evidence</a> —
                    inspect the source geography, coverage, and unassessed
                    factors.
                  </li>
                  <li>
                    <a href={`/life-simulator?city=${city.slug}`}>
                      Your household budget
                    </a>{' '}
                    — use your income and assumptions to estimate monthly costs.
                  </li>
                </ul>
                <p>
                  These links open the existing tools with {city.name} selected.
                  Household assumptions remain on your device and are not
                  included in the links.
                </p>
              </section>
              <section>
                <h2>What this guide can and cannot answer</h2>
                <p>
                  This snapshot helps you start your research. It does not rank{' '}
                  {city.name} as universally affordable, safe, or suitable.
                  Neighborhood prices, school eligibility, insurance quotes,
                  actual taxes, and your daily commute need address-specific
                  checks. Open the app for more source context, and verify
                  consequential decisions with the provider or a qualified
                  professional.
                </p>
                <a href="/about/">
                  Read our source definitions and methodology
                </a>
              </section>
            </>
          ) : page?.kind === 'directory' ? (
            <>
              <p className="eyebrow">PUBLIC CITY GUIDES</p>
              <h1>Research U.S. cities before you move</h1>
              <p className="public-lead">
                Compare dated housing snapshots and continue into the research
                tools. Each guide identifies its sources and explains what the
                numbers mean.
              </p>
              <div className="public-city-grid">
                {publicCities.map((entry) => (
                  <a
                    className="public-city-card"
                    key={entry.slug}
                    href={cityGuidePath(entry)}
                  >
                    <h2>{entry.name}</h2>
                    <p>{entry.admin1}</p>
                    <span>Housing snapshot and research guide →</span>
                  </a>
                ))}
              </div>
              <p>
                These six cities are the first published guides. The app’s
                search supports other cities; publishing a guide requires a
                useful sourced snapshot.
              </p>
            </>
          ) : page?.kind === 'about' ? (
            <>
              <p className="eyebrow">DATA AND METHODOLOGY</p>
              <h1>Evidence you can inspect</h1>
              <p className="public-lead">
                MyCityIntel helps you research U.S. cities, compare trade-offs,
                and plan a move. It separates source observations from estimates
                and your own assumptions.
              </p>
              <section>
                <h2>Where the data comes from</h2>
                <Sources />
                <p>
                  Sources cover different geographies and observation periods. A
                  county unemployment rate, a city rent index, and a
                  Census-tract risk score are not measurements of the same area.
                  The app labels dates, sources, and geographic limitations
                  where the data is shown.
                </p>
              </section>
              <section>
                <h2>How calculations are labeled</h2>
                <p>
                  Reported values are observations from a named provider.
                  Calculated values use visible source data and disclosed
                  formulas. Estimated values use planning fallbacks when a more
                  precise observation is unavailable. Unavailable values remain
                  missing rather than being treated as zero or as evidence of
                  safety.
                </p>
                <p>
                  Life Simulator costs, fit scores, and regret factors depend on
                  household inputs and application assumptions. They are
                  planning tools, not validated predictions or personalized
                  financial, tax, insurance, or employment advice.
                </p>
              </section>
              <section>
                <h2>Dates and updates</h2>
                <p>
                  Public city guides are generated from the local Zillow dataset
                  when the site is built. Every housing figure has its own
                  observation period. The interactive app also requests provider
                  data; provider publication schedules and caches mean different
                  cards can have different dates.
                </p>
              </section>
              <section>
                <h2>Your household stays on your device</h2>
                <p>
                  The app has no account system. Household inputs, shortlist,
                  and progress are stored in your browser. City links contain
                  only city identifiers or city-center coordinates and labels.
                  Opening a city guide does not replace your saved household
                  profile.
                </p>
                <p>
                  Public data requests still contact the relevant services. A
                  personal budget or home/work address is not published in a
                  city guide.
                </p>
              </section>
              <section>
                <h2>Project and corrections</h2>
                <p>
                  MyCityIntel is a project by{' '}
                  <a href="https://lloydmarcelino.com">Lloyd Marcelino</a>. To
                  verify or correct a source observation, start with the
                  provider link shown with the measurement. Planning assumptions
                  can be edited in the app.
                </p>
              </section>
            </>
          ) : (
            <>
              <h1>Page not found</h1>
              <p>This city guide or page is not available.</p>
              <a className="public-cta" href="/cities/">
                Browse city guides
              </a>
            </>
          )}
          {page?.kind !== 'directory' && <PublicResearchLinks />}
        </article>
        <footer>
          <a href="/">MyCityIntel</a>
          <a href="/cities/">City guides</a>
          <a href="/about/">Data and methodology</a>
          <span className="footer-copyright">
            <a href="https://lloydmarcelino.com">lloydmarcelino.com</a> © 2026
          </span>
        </footer>
      </main>
    </div>
  )
}

export default PublicPage
