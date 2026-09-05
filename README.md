# HomeIntel

HomeIntel is a React and TypeScript city-research, relocation-comparison, and life-simulation dashboard. It helps users investigate cities they may move to, understand housing, population, employment, weather, mapping, and natural-hazard conditions, compare shortlisted cities, and model how a move could affect their monthly budget and priorities.

The application does not start with a hard-coded city. The selected and comparison cities are stored in Zustand, while remote data is loaded and cached through TanStack Query.

## Features

- Worldwide city and ZIP-code search through Open-Meteo
- Interactive Leaflet map with OpenStreetMap tiles
- Compact live weather summary on Overview, with daily high/low, humidity, and wind details on Environment
- Interactive Environment-page commute map with click-to-select start and destination points
- Current traffic-aware drive time, free-flow comparison, delay, and condition when TomTom is configured
- Sampled morning and evening rush-hour travel times with the slowest weekday window identified
- Baseline point-to-point routing when live traffic is unavailable, without presenting fallback results as live
- Nearby OpenStreetMap bus, train, subway, and tram stops plus transparent walking and cycling estimates
- Outdoor comfort estimate based on feels-like temperature, humidity, wind, precipitation, and storm conditions
- Zillow ZHVI typical home values and ZORI market rents
- Expandable Housing metric details with direct Zillow and Census source citations
- Census ACS housing, demographic, education, and employment indicators
- Census ACS race and ethnicity composition using mutually exclusive B03002 categories
- Public K-12 school discovery using the nationwide Common Core of Data (CCD)
- Grade-band tabs for Pre-K, Kindergarten, grades 1-6, middle/high school, and statewide online schools
- K-12 search by school name, district, or address, with pagination and expandable metadata
- Current BLS LAUS city labor conditions with downloadable-file fallback
- Annual employment momentum from 2019 through 2026, using reported monthly data when available and clearly marked QCEW-based estimates otherwise
- Census QWI county workforce flows and optional BEA county GDP growth
- Regional employment landscape with sector tabs, company links, pagination, federal contractors, nearby headquarters, and major hospitals
- Census Vintage 2025 city population estimates
- Calculated current-year population based on a linear trend fitted to official 2023–2025 city estimates
- FEMA National Risk Index profile and individual hazard scores
- Housing, People, Employment, Risk, and Environment pages
- Housing and demographic visualizations
- Data-driven HomeIntel Briefs for Housing and People
- Side-by-side city comparison interface
- Deterministic Life Simulator at `/life-simulator`, with no AI-generated calculations
- Monthly disposable-income model with editable income, tax, household, commute, healthcare, childcare, debt, and essential-cost assumptions
- Rent and buy scenarios, including a transparent 30-year fixed-mortgage calculation
- Total housing exposure combining housing, utilities, transportation, and a FEMA-based planning reserve
- Explainable deal-breaker matching, weighted city-fit results, and relocation-regret risk
- Career compatibility using Census employment rates, worker earnings, and industry categories
- Two-person household consensus with independent priority weights and optional second-city comparison
- Data-confidence ratings that distinguish strong source coverage from broader estimates or unavailable data
- Per-city move-readiness checklists and locally saved simulator preferences
- First-visit quick-start guide plus accessible field and confidence tooltips for mouse, keyboard, and touch users
- Lightweight Overview queries that avoid loading detail-only employment and demographic requests
- Responsive desktop and mobile layouts
- Animated, hover-responsive charts with reduced-motion support
- Persistent light and dark appearance modes
- Material UI loading indicators
- ESLint and Prettier integration

## Technology

- React
- TypeScript
- Vite
- Zustand
- TanStack Query
- Material UI
- Radix UI Primitives
- Tailwind CSS 4 with the official Vite plugin
- React Leaflet and Leaflet
- Lucide React
- ESLint and Prettier

## Getting started

### Requirements

- Node.js 22 or newer
- npm
- A free U.S. Census Data API key

### Installation

```bash
npm install
```

Copy `.env.example` to `.env` and provide the Census and Data.gov keys:

```env
VITE_CENSUS_API_KEY=your_census_api_key
DATA_GOV_API_KEY=your_data_gov_api_key
```

Request a Census key at <https://api.census.gov/data/key_signup.html> and a Data.gov key at <https://api.data.gov/signup/>.

Start the application:

```bash
npm run dev
```

Vite normally serves the application at `http://localhost:5173`. Restart the development server after changing `.env`.

## Commands

| Command                      | Purpose                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                | Start the Vite development server                                          |
| `npm run build`              | Type-check and create a production build                                   |
| `npm run preview`            | Preview the production build                                               |
| `npm run lint`               | Run ESLint                                                                 |
| `npm run lint:fix`           | Fix supported ESLint issues                                                |
| `npm run format`             | Format the repository with Prettier                                        |
| `npm run format:check`       | Check formatting without editing files                                     |
| `npm test`                   | Run deterministic Life Simulator calculation tests                         |
| `npm run data:update`        | Refresh the normalized Zillow Research dataset                             |
| `npm run build:with-data`    | Refresh Zillow data and create a production build                          |
| `npm run validate homeintel` | Refresh Zillow data, check formatting, lint, build, and audit dependencies |

## Data sources

### Open-Meteo

Open-Meteo provides two keyless services:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Weather: `https://api.open-meteo.com/v1/forecast`

The weather request uses the selected coordinates and includes temperature, apparent temperature, humidity, weather code, wind speed, and daily high/low in local time.

### OpenStreetMap

The selected location is rendered with React Leaflet and OpenStreetMap tiles. Required map attribution remains visible.

The Environment commute planner also queries nearby mapped bus stops, train stations, subway entrances, and tram stops through a same-origin Overpass proxy. These records indicate mapped infrastructure only; they do not provide timetables, fares, service alerts, accessibility, or a complete public-transit itinerary.

### TomTom traffic and routing

When the optional server-only `TOMTOM_API_KEY` is configured, the Environment commute planner uses TomTom's Calculate Route API with traffic enabled. The current route response includes traffic-aware travel time, free-flow time, traffic delay, distance, and route geometry. Six future weekday departure samples—6:30, 7:30, and 8:30 AM plus 4:00, 5:00, and 6:00 PM—use TomTom's time-dependent historical traffic model to compare common rush-hour windows.

If the key is absent or TomTom is temporarily unavailable, the proxy requests an OSRM baseline road route. The interface labels this as **Baseline routing**, hides live congestion and rush-hour claims, and explains how to enable traffic data. Walking and cycling times are distance-only estimates and are not pedestrian- or bicycle-routed itineraries.

### Zillow Research

Housing uses Zillow's public Research downloads:

- ZHVI: typical home value
- ZORI: typical observed market rent

These are market indices, not individual-property Zestimates or guaranteed asking rents. The updater normalizes Zillow's city CSV files into:

```text
public/data/zillow-market.json
```

Source: <https://www.zillow.com/research/data/>

### Census ACS 2020–2024

The ACS five-year detailed tables provide data for all U.S. places. HomeIntel uses them for:

- Population fallback and 2019 comparison
- Median household income
- Median age
- Employment rate
- Bachelor's degree or higher
- Average household size
- Foreign-born population share
- Owner-occupied housing share
- Home value and gross-rent fallbacks

Important variables include:

| Variable      | Meaning                              |
| ------------- | ------------------------------------ |
| `B01003_001E` | Total population                     |
| `B01002_001E` | Median age                           |
| `B19013_001E` | Median household income              |
| `B23025_003E` | Civilian labor force                 |
| `B23025_004E` | Employed civilian labor force        |
| `B15003_*`    | Educational attainment               |
| `B25010_001E` | Average household size               |
| `B05002_*`    | Nativity and foreign-born population |
| `B03002_*`    | Hispanic or Latino origin by race    |
| `B25003_002E` | Owner-occupied housing units         |
| `B25003_003E` | Renter-occupied housing units        |
| `B25077_001E` | Median owner-occupied home value     |
| `B25064_001E` | Median gross rent                    |

Employment industries and median worker earnings come from the ACS DP03 Selected Economic Characteristics profile. Detailed ACS table C24030 separates Information, Professional services, Management & administrative services, Educational services, and Health care & social assistance. ACS table B24134 further breaks professional, scientific, and technical services into detailed industries. Information and Professional Services remain separate sectors in the chart. The Professional Services detail list below the chart shows each industry returned by B24134 without adding those industries to the pie-chart legend.

The employment service resolves the Census state FIPS code from a local state table instead of making a separate state-discovery request. After the initial place lookup identifies the Census place code, C24030, B24134, and the six annual-history requests run concurrently. Browser-side Census requests have a 12-second timeout and remain cancellable when the selected city changes.

### Census Vintage 2025 population estimates

The official Census Vintage 2025 incorporated-place table supplies point estimates for 2023, 2024, and 2025. The normalized local lookup contains approximately 19,500 incorporated places:

```text
public/data/census-population-2025.json
```

HomeIntel calculates the current-year value with an ordinary least-squares linear trend fitted to all three official annual population levels:

```text
mean year = average(2023, 2024, 2025)
mean population = average(population 2023, population 2024, population 2025)
slope = sum((year - mean year) * (population - mean population)) / sum((year - mean year)^2)
population 2026 = mean population + slope * (2026 - mean year)
```

The 2026 result is a HomeIntel calculation, not an official Census estimate. The interface labels it accordingly. If the selected location does not match an incorporated place in the Vintage 2025 table, the application keeps the 2024 ACS value and explains that the 2025 city estimate was unavailable.

The People chart compares the 2019 ACS estimate with the calculated current-year value. These are different Census series, so the comparison is useful for broad context but should not be treated as a precise official time series.

The demographics service resolves state FIPS codes locally, eliminating a Census state-discovery call. After the selected Census place is identified, state and national education comparisons, the 2019 population observation, and the local Vintage 2025 dataset load concurrently. Census calls have a 12-second timeout and optional comparison failures do not discard the primary city demographics.

Source: <https://www.census.gov/newsroom/press-kits/2026/vintage-2025-city-town-pop-estimates.html>

### FEMA National Risk Index

The Risk Profile uses FEMA's December 2025 National Risk Index Census-tract layer. The selected city's longitude and latitude identify the containing tract. HomeIntel displays:

- Composite Expected Annual Loss score and rating
- Highest individual natural-hazard Expected Annual Loss scores
- Inland-flooding Expected Annual Loss score
- Community-resilience score and rating

Expected Annual Loss combines modeled hazard frequency, exposure, and estimated consequences. Scores are normalized from 0 to 100 relative to other Census tracts; they are not disaster probabilities, citywide averages, property-level forecasts, dollar-loss predictions, or insurance determinations. The interface identifies the selected Census tract to make this geographic limitation explicit. FEMA risk data is available only for U.S. locations.

Source: <https://hazards.fema.gov/nri/>

### Current employment and annual economic momentum

The Employment page combines several public labor and economic sources:

- BLS Local Area Unemployment Statistics (LAUS) for city employment and unemployment
- BLS Quarterly Census of Employment and Wages (QCEW) for county employment growth and wages
- Census Quarterly Workforce Indicators (QWI) for county hires and separations
- BEA Regional data for county real GDP when `BEA_API_KEY` is configured

The server first requests LAUS through the BLS Public Data API. That unauthenticated API has a daily request quota. If the API is unavailable, rate-limited, or returns empty series, HomeIntel resolves the selected city's LAUS area code dynamically and reads the official BLS five-year downloadable files:

```text
la.data.0.CurrentU15-19
la.data.0.CurrentU20-24
la.data.0.CurrentU25-29
```

These files are downloaded once per server process and cached in memory. The fallback is not tied to San Diego or Dallas; it works for any U.S. city represented in the BLS LAUS area file. The chart uses monthly annual averages and marks an incomplete current year as `YTD`. If reported LAUS data does not yet reach the current year, the chart extends the latest employment value using the newest available QCEW covered-job growth rate and marks the result `est.`.

The Current unemployment card always displays the observation period and geography. A value such as June 2026 is a reported monthly LAUS rate, not a HomeIntel forecast. After a single FCC coordinate-to-county lookup, LAUS, QCEW, QWI, and optional BEA work starts concurrently. QCEW and QWI candidate quarters are also requested concurrently and the newest available observation is selected in configured order. Individual provider failures degrade to unavailable cards instead of failing the combined response.

### Regional employment landscape

The Regional Employment Landscape is assembled dynamically for the selected U.S. city:

- **USAspending:** federal contract recipients with recent contract work performed in surrounding counties. Totals cover the latest three years and represent contract obligations, not local employee counts.
- **Wikidata:** strategic companies whose headquarters coordinates are within 85 kilometers (about 53 miles) of the selected city center. Headquarters distance is calculated from the returned geospatial distance.
- **U.S. Hospitals HIFLD feature service:** open hospital facilities within a 50-mile radius. Major facilities are ranked using reported beds, staff, and distance. Hospital websites appear only when supplied by the source.

Companies are classified into sectors such as Defense & government, Technology, Health & life sciences, Advanced manufacturing, Finance, Energy, and Transportation. The four strongest available sector groups are shown, and Health & life sciences is retained whenever qualifying health organizations or hospitals are found. Each tab displays six cards per page; switching tabs resets the destination tab to page 1.

Federal contract place-of-performance data is county-based, so its geography is an approximate surrounding region rather than an exact 50-mile circle. A contractor card does not show distance because USAspending does not consistently provide an office coordinate. Hospital and Wikidata-headquarters cards show distance because those sources provide facility coordinates.

USAspending recipients use source-provided details or a small curated profile for well-known companies; the application does not issue per-company Wikidata lookups. Five FCC samples—the city center and four cardinal points—identify surrounding counties before one USAspending aggregation request. The three employer sources use separate TanStack Query entries and load independently, so available results render without waiting for the slowest provider. Components do not call third-party APIs directly when a same-origin proxy is required.

#### Employment performance configuration

The employment refactor uses bounded requests and layered caching:

- Direct Census employment requests time out after 12 seconds. The employer browser requests time out after 15 seconds.
- Server-side upstream requests time out after 12 seconds unless an endpoint defines a narrower policy.
- `/api/current-economy` caches each successful city response in server memory for six hours and sends `Cache-Control: private, max-age=21600`.
- `/api/major-employers`, `/api/federal-contractors`, and `/api/major-hospitals` cache successful coordinate-based responses in server memory for 24 hours and send `Cache-Control: private, max-age=86400`.
- LAUS area metadata and fallback flat files are shared across requests for the lifetime of the server process. A failed initial download clears its promise so a later request can retry.
- Employer queries retry once in TanStack Query. A loading indicator remains visible while slower sources continue, but already-returned source data is usable immediately.

The proxy's in-memory caches are process-local and reset when Vite or the production server restarts. Browsers may continue using a fresh response according to its `Cache-Control` header; use a hard reload when testing a forced refresh. A production implementation should preserve the same response contracts, timeout behavior, and cache lifetimes when moving the handlers to serverless or edge infrastructure.

### Public K-12 and statewide online schools

The People page loads public-school directory records from the Urban Institute Education Data Portal, which republishes the U.S. Department of Education Common Core of Data (CCD). The API is free, requires no key, and currently uses the 2024 school directory endpoint.

Schools and colleges are collapsed secondary sections and do not request data during the People page's initial render. Each query is enabled the first time its section is opened. The `/api/nearby-schools` proxy downloads only open, regular schools for the selected state, caches that filtered state dataset once per server process, and returns two collections:

- Schools whose reported physical city matches the selected city. A 15-mile coordinate fallback is used only when no exact city records are found.
- Fully virtual public schools from the entire selected state (`virtual === 1`). Statewide online results are not limited to the selected city because an administrative address does not define where virtual students attend.

Local records are organized into Pre-K, Kindergarten, grades 1-6, and middle/high tabs from reported grade ranges and CCD grade-band flags. A school can appear in multiple tabs when it serves multiple grade bands. The Online tab contains statewide fully virtual schools; Texas results were verified to include University of Texas at Austin High School and Texas Tech University K-12.

Each tab supports search by school name, district, or address and displays six records per page. Cards show identity, address, grade range, operating profile, enrollment, staffing ratio, teacher FTE, and distance for local schools. Distance is hidden for statewide online schools. View details exposes identifiers, contact data, program flags, lunch-access fields, geography codes, and reporting year. Missing CCD values and negative sentinel codes are displayed as `Not reported`.

Results are ordered by lower reported student-to-teacher ratio and then enrollment. This is a staffing comparison, not an academic ranking. The ratio is enrollment divided by reported full-time-equivalent teachers and is not average classroom size. Online schools without staffing data remain visible.

Successful city-specific school and state-specific College Scorecard proxy responses are cached for 24 hours and include private browser cache headers. School upstream requests have a 30-second server timeout and a 35-second browser timeout; College Scorecard uses a 15-second server timeout and an 18-second browser timeout.

## Life Simulator

The Life Simulator turns HomeIntel's city data into an editable household planning scenario. Select a city, open **Simulator** in the sidebar, and follow the quick-start guide:

1. Enter annual household income, household size, a rent-or-buy plan, an effective tax assumption, commute details, and recurring expenses.
2. Review gross monthly income, itemized modeled costs, disposable income, and total housing exposure. Each cost row can be expanded to show its assumption.
3. Set non-negotiable housing, cash-buffer, FEMA-risk, employment-rate, and optional career-field requirements.
4. Adjust personal and partner priority weights. Add a comparison city to see which option provides the stronger household compromise.
5. Review data confidence and complete the move-readiness checklist before relying on the result.

The guide opens for first-time users and can be hidden or reopened with **How to use**. Help icons beside every input explain the field on hover, keyboard focus, click, or tap. Simulator settings, guide visibility, household preferences, and per-city checklist progress are saved in browser `localStorage`.

### Deterministic calculations

`src/services/lifeSimulator.ts` contains pure calculation functions. React renders their results but does not calculate them, making the formulas independently testable. No language model or generative AI determines taxes, expenses, scores, comparisons, or recommendations.

The monthly result is:

```text
Gross monthly household income
  - user-selected effective tax percentage
  - rent, or mortgage plus property-tax/insurance allowance
  - household-size and regional-price-adjusted utilities
  - household-size and regional-price-adjusted groceries
  - commute fuel and transportation allowance
  - user-entered healthcare, childcare, debt, and other essentials
  - transparent FEMA-risk planning reserve
= estimated disposable income
```

Buy scenarios use the standard amortization formula for a 30-year fixed mortgage with the user's down-payment and interest-rate assumptions. The property-tax and insurance allowance is 1.8% of the typical home value annually. The hazard reserve is a planning buffer that scales from zero to 3.5% of housing cost as the FEMA risk score moves from 0 to 100. These are editable planning assumptions, not quotes or financial advice.

Total housing exposure combines housing, utilities, transportation, and the hazard reserve. Its burden percentage divides that exposure by gross monthly income.

### Fit, regret, deal-breakers, and consensus

City fit is a weighted result from four visible dimensions:

- **Affordability** uses disposable-income share and applies additional pressure when housing exposure exceeds 40% of gross income.
- **Career** uses the Census employment rate and, when selected, the size and presence of a matching Census industry.
- **Safety** is the inverse of the FEMA Expected Annual Loss score.
- **Community** currently uses college-educated population share as a limited demographic proxy.

The user's priority sliders control the weight of each dimension. The regret score begins with the inverse fit score, adds seven points for every failed deal-breaker, adds pressure when housing exposure exceeds 45%, and adds a penalty for negative disposable income. All scores are clamped from 0 to 100 and supporting reasons remain visible in the interface.

Deal-breakers are evaluated independently and show the configured rule, the calculated city value, and a pass/fail result. Household consensus calculates each person's weighted score independently, averages the two scores, and reports alignment based on the difference between them. It does not allow one hidden overall score to replace the individual requirements.

### Data-confidence meanings

Confidence describes the quality and geographic precision of the source, not whether the city performed well:

- **High** is good source confidence: a recent authoritative value is available at a relevant city or tract geography. The value may still be a survey or model estimate.
- **Medium** is useful but less precise: the value may use broader geography, an older observation, or a fallback dataset.
- **Estimated** means HomeIntel is applying a disclosed planning fallback because a more precise city value is unavailable.
- **Loading** means the source request is still in progress and the rating may change.
- **Unavailable** means no verified value was returned and the category should be independently confirmed.

Until a new city's requests finish, or when a source is unavailable, the simulator can use disclosed planning defaults adjusted by the available regional price index. The confidence card exposes this limitation rather than presenting fallback data as verified city observations.

## Architecture

Remote server state remains in TanStack Query. Zustand stores user/session state only. Browser components do not download state-sized CCD responses directly; Vite middleware adds compatible request headers, handles failures, filters the response, and sends only relevant records to the browser.

![HomeIntel architecture diagram](docs/homeintel-architecture.svg)

The diagram can be edited in diagrams.net using [`docs/homeintel-architecture.drawio`](docs/homeintel-architecture.drawio). The SVG is committed separately so GitHub can render the architecture without requiring draw.io.

```text
User interface
  React pages and components
        |
        +-- Zustand ------------------------------------+
        |   Selected city, comparison city, route/UI    |
        |                                               |
        +-- Deterministic calculation engine -----------+
        |   Costs, deal-breakers, fit/regret, consensus |
        |                                               |
        +-- localStorage --------------------------------+
        |   Simulator assumptions, guide, checklists    |
        |                                               |
        +-- TanStack Query hooks                        |
                Query keys, caching, retries, signals   |
                        |                               |
                  Service modules                       |
                Parsing and normalization               |
                        |                               |
          +-------------+------------------+            |
          |                                |            |
    Browser-safe APIs              Same-origin /api/*   |
    and local JSON files           Vite server proxies  |
          |                                |            |
    Open-Meteo, Census,             BLS, BEA, FBI,      |
    FEMA, Zillow snapshots          USAspending,        |
                                   Wikidata, HIFLD      |
```

The major layers are:

1. **Pages and components (`src/pages`, `src/components`)** render the dashboard, charts, cards, maps, sector tabs, pagination, and responsive navigation.
2. **Zustand (`src/store/useAppStore.ts`)** stores application state that belongs to the user session, such as the selected city, comparison city, active page, and mobile-navigation state.
3. **TanStack Query hooks (`src/hooks`)** own asynchronous server state. Hooks define cache keys, stale times, cancellation, and query-enabling conditions.
4. **Services (`src/services`)** build request parameters, call local or remote endpoints, validate response shapes, normalize records, calculate derived values, and return UI-ready data. `lifeSimulator.ts` is a pure synchronous calculation service with no network or React dependencies.
5. **Browser persistence (`localStorage`)** retains simulator assumptions, two-person preference weights, guide visibility, theme, and per-city readiness checklists on the current device.
6. **Vite integration proxies (`vite.config.ts`)** protect server-only keys, avoid browser CORS restrictions, combine upstream sources, and implement fallbacks. These endpoints run in Vite development and preview servers.
7. **Local normalized datasets (`public/data`)** provide Zillow market history and Census population estimates without repeatedly downloading large source files in the browser.

### API and data flow

| Domain                   | Source                                      | Access path                                  | Key              | Geography                            | Fallback or transformation                                         |
| ------------------------ | ------------------------------------------- | -------------------------------------------- | ---------------- | ------------------------------------ | ------------------------------------------------------------------ |
| City search              | Open-Meteo Geocoding                        | Browser service                              | No               | Worldwide place/ZIP results          | Selected coordinates are stored in Zustand                         |
| Weather                  | Open-Meteo Forecast                         | Browser service                              | No               | Selected coordinates                 | Comfort score is calculated locally from weather conditions        |
| Map                      | OpenStreetMap tiles                         | React Leaflet                                | No               | Selected coordinates                 | Map attribution remains visible                                    |
| Housing market           | Zillow Research                             | Local normalized JSON                        | No               | Zillow city/region                   | ACS housing values are used when Zillow has no match               |
| Demographics and housing | Census ACS five-year                        | Browser service                              | Census key       | U.S. place                           | Variables are normalized into snapshot cards and charts            |
| Population               | Census Vintage 2025                         | Local normalized JSON                        | No               | U.S. incorporated place              | Current-year value uses the documented average-change calculation  |
| Current labor market     | BLS LAUS                                    | `/api/current-economy`                       | No               | U.S. city area                       | BLS API first; official five-year flat files on quota/failure      |
| County jobs and wages    | BLS QCEW                                    | `/api/current-economy`                       | No               | Selected city’s county               | Checks candidate quarters concurrently and selects the newest      |
| Workforce flows          | Census QWI                                  | `/api/current-economy`                       | Census key       | Selected city’s county               | Checks candidate quarters concurrently and selects the newest      |
| Real GDP                 | BEA Regional API                            | `/api/current-economy`                       | Optional BEA key | Selected city’s county               | Card remains unavailable when no key or observations exist         |
| Federal contractors      | USAspending                                 | `/api/federal-contractors`                   | No               | Counties around selected coordinates | Merges duplicate recipients and ranks recent obligations           |
| Nearby headquarters      | Wikidata Query Service                      | `/api/major-employers`                       | No               | 85 km around city center             | Filters to strategic sectors and organizations with reported scale |
| Contractor presentation  | USAspending plus curated profiles           | `/api/federal-contractors` and service layer | No               | Regional recipient                   | Uses source details or a curated profile without per-company calls |
| Major hospitals          | U.S. Hospitals HIFLD ArcGIS feature service | `/api/major-hospitals`                       | No               | Exact 50-mile radius                 | Filters open facilities and ranks by beds, staff, then distance    |
| Crime                    | FBI Crime Data API                          | Same-origin proxy                            | Data.gov key     | U.S. state/city coverage             | Proxy prevents exposing the key and avoids browser CORS errors     |
| Natural hazards          | FEMA National Risk Index                    | Browser service                              | No               | Containing U.S. Census tract         | Converts relative hazard scores into the documented risk profile   |
| Traffic-aware routing    | TomTom Calculate Route                      | `/api/traffic-route`                         | Optional TomTom  | User-selected point-to-point route   | OSRM baseline route when live traffic is unavailable               |
| Transit infrastructure   | OpenStreetMap Overpass                      | `/api/transit-options`                       | No               | 2.5 km around both route endpoints   | Deduplicates and classifies mapped bus and rail stops              |
| Universities             | College Scorecard                           | Same-origin proxy                            | Data.gov key     | Radius around selected coordinates   | Ranks nearby colleges and enriches displayed institution details   |
| Public K-12 schools      | Urban Education Data Portal / NCES CCD      | `/api/nearby-schools`                        | No               | Selected city and selected state     | City grade bands plus statewide fully virtual public schools       |

### Server proxy endpoints

The Vite configuration currently exposes these application-facing endpoints:

| Endpoint                         | Purpose                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `/api/current-economy`           | Resolves county geography and combines LAUS, QCEW, QWI, and optional BEA data |
| `/api/major-employers`           | Queries nearby strategic headquarters from Wikidata                           |
| `/api/federal-contractors`       | Finds and aggregates regional federal contract recipients                     |
| `/api/major-hospitals`           | Queries open hospital facilities within 50 miles                              |
| FBI crime proxy endpoint         | Keeps the Data.gov key server-side and handles CORS                           |
| College Scorecard proxy endpoint | Keeps the Data.gov key server-side and returns nearby universities            |
| `/api/nearby-schools`            | Caches a state CCD directory and returns local and statewide-online schools   |
| `/api/traffic-route`             | Returns live traffic and rush samples, or a clearly labeled baseline route    |
| `/api/transit-options`           | Finds mapped bus, train, subway, and tram stops near both commute endpoints   |

These Vite middleware functions are appropriate for local development and preview. A production static host does not execute `vite.config.ts` middleware. Production deployment must recreate the `/api/*` handlers as serverless functions, edge functions, or routes in a Node server and keep their response contracts unchanged.

### Caching and failure behavior

- TanStack Query caches API results by selected city and dataset version.
- Overview uses lightweight demographic and employment query variants. Detail-only comparison tables, annual employment history, and industry breakdown calls are deferred until their dedicated pages need them.
- `AbortSignal` cancels obsolete requests when the selected city changes.
- Query keys include version labels when a response format or fallback strategy changes, preventing stale incompatible data from being reused.
- LAUS area metadata and downloadable fallback files are fetched once per server process and cached in memory.
- QCEW and QWI candidate periods are fetched concurrently; configured newest-to-oldest order determines which successful observation is used.
- Current-economy responses are cached for six hours; Wikidata, USAspending, and HIFLD responses are cached independently for 24 hours.
- Wikidata, USAspending, and HIFLD use independent queries. The employer section renders partial results and fails only when every employer source fails.
- External employment requests have explicit timeout limits, and obsolete browser requests are still cancelled when the city changes.
- Missing optional fields, such as hospital beds or company websites, are omitted rather than invented.
- Only open, regular CCD state-directory records are downloaded. The filtered state dataset is cached once per server process, and successful city responses are cached for 24 hours.
- College and K-12 queries are lazy: they start when their collapsed People-page section is first opened rather than delaying the initial page load.
- Successful state-level College Scorecard responses are cached for 24 hours.
- The school proxy supplies explicit JSON and application-identification headers because the upstream service rejects Node's default request identity with HTTP 403.

### Derived data versus reported data

HomeIntel distinguishes source observations from application calculations:

- `YTD` identifies a reported annual average based on fewer than 12 published months.
- `est.` identifies a current-year employment value extended with the latest available QCEW growth rate.
- Current-year population is calculated from the documented recent Census annual-change method.
- Weather comfort is a HomeIntel scale derived from several Open-Meteo variables.
- FEMA scores are normalized comparative risk indicators, not probabilities.
- Federal contract obligations describe regional contract activity and are not local payroll or employee estimates.
- K-12 student-to-teacher ratios are calculated from CCD enrollment and teacher FTE; they are not class-size or academic-quality ratings.
- Life Simulator costs, deal-breakers, fit, regret, housing exposure, and consensus are deterministic HomeIntel calculations based on visible source values and user assumptions.
- The effective tax percentage is supplied by the user. HomeIntel does not infer a tax return, filing status, deductions, or legal tax liability.
- Life Simulator confidence labels describe source quality and precision, not whether a city has a favorable result.
- Traffic condition is calculated from the percentage difference between the traffic-aware time and free-flow time: under 8% is Light, 8–19% Moderate, 20–39% Heavy, and 40% or more Severe.
- Rush-hour results compare six disclosed weekday departure samples rather than claiming to identify every possible slowdown minute.

### Zustand

`src/store/useAppStore.ts` stores client state:

- Active page
- Selected city
- Comparison city
- Mobile-navigation state

API responses are not stored in Zustand.

Life Simulator form values are intentionally stored in `localStorage`, not Zustand, so they survive a reload on the same browser. They are not synchronized to an account or sent to an AI service.

### TanStack Query hooks

All React Query configuration is centralized in `src/hooks`:

- `useLocationSearchQuery.ts`
- `useWeatherQuery.ts`
- `useHousingQuery.ts`
- `useDemographicsQuery.ts`
- `useEmploymentQuery.ts`
- `useCurrentEconomyQuery.ts`
- `useMajorEmployersQuery.ts`
- `useRiskQuery.ts`
- `useNearbyCollegesQuery.ts`
- `useNearbySchoolsQuery.ts`

The hooks own query keys, cancellation signals, enabling conditions, and stale times. UI components consume the hooks without containing direct `useQuery` or API `fetch` calls.

The shared `QueryClient` is configured in `src/main.tsx`.

### Radix UI

HomeIntel uses unstyled Radix primitives for accessible interactive controls
while retaining the project's custom visual design. The Explore/Compare
navigation uses Radix Tabs, and the Housing chart's Home value/Rent selector
uses Radix Toggle Group. Radix supplies keyboard navigation, ARIA behavior, and
interaction state through `data-state` attributes.

The K-12 grade selector uses Radix Tabs. Each school card uses Radix Collapsible for its View details control, including keyboard and screen-reader interaction states.

The header theme control uses Radix Switch. The selected light or dark mode is
saved in `localStorage`; on a first visit, HomeIntel follows the operating
system's `prefers-color-scheme` setting. Dark mode uses a dedicated AI-dashboard
theme with blue-black surfaces, violet/cyan accents, translucent cards, and
subtle ambient glow while preserving accessible contrast.

### Tailwind CSS

Tailwind CSS is integrated through `@tailwindcss/vite` and imported by
`src/styles.css`. New and refactored component interactions use Tailwind
utilities for transitions, hover elevation, keyboard focus rings, responsive
behavior, and state-driven animation. The existing dashboard stylesheet remains
in place while components are migrated incrementally to avoid a risky visual
rewrite.

Overview metric cards use Radix Collapsible with Tailwind animation utilities,
allowing readers to reveal supporting context with a mouse, keyboard, or touch.

### Coding standards

- Project-owned JavaScript and TypeScript functions use arrow-function syntax. ESLint rejects function declarations and function expressions.
- Internal `src` imports use configured absolute paths such as `components/SearchBox`, `hooks/useNearbySchoolsQuery`, and `services/schools` rather than `../` paths.
- TypeScript `paths`, Vite aliases, and ESLint restrictions keep absolute imports consistent at compile time, runtime, and during linting.
- Prettier owns formatting; run the validation command before committing.

## Project structure

The K-12 feature follows the same layered structure as the rest of the app:

- `src/components/NearbySchools.tsx` owns grade tabs, school search, pagination, card presentation, profile summaries, and expandable details.
- `src/hooks/useNearbySchoolsQuery.ts` owns the TanStack Query key, cancellation signal, enablement, and seven-day stale time.
- `src/services/schools.ts` normalizes CCD records, calculates distance and staffing ratio, classifies grade bands, and preserves statewide online schools with missing staffing data.
- `vite.config.ts` implements `/api/nearby-schools`, state/FIPS resolution, upstream request headers, per-process state caching, exact-city filtering, coordinate fallback, and statewide virtual filtering.

```text
homeIntel/
├── .github/workflows/
│   └── update-zillow-data.yml
├── public/data/
│   ├── census-population-2025.json
│   └── zillow-market.json
├── scripts/
│   └── update-zillow-data.mjs
├── tests/
│   └── lifeSimulator.test.mjs
├── src/
│   ├── assets/images/
│   ├── components/
│   │   ├── CityMap.tsx
│   │   ├── HousingTrendChart.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MetricCard.tsx
│   │   ├── PeopleProfileChart.tsx
│   │   ├── ScoreRing.tsx
│   │   ├── SearchBox.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TrafficCommute.tsx
│   │   └── WeatherCard.tsx
│   ├── data/
│   │   └── cities.ts
│   ├── hooks/
│   │   ├── useDemographicsQuery.ts
│   │   ├── useCommuteQuery.ts
│   │   ├── useEmploymentQuery.ts
│   │   ├── useHousingQuery.ts
│   │   ├── useLocationSearchQuery.ts
│   │   ├── useRiskQuery.ts
│   │   └── useWeatherQuery.ts
│   ├── pages/
│   │   ├── CategoryPage.tsx
│   │   ├── ComparePage.tsx
│   │   ├── LifeSimulatorPage.tsx
│   │   └── OverviewPage.tsx
│   ├── services/
│   │   ├── demographics.ts
│   │   ├── employment.ts
│   │   ├── housing.ts
│   │   ├── lifeSimulator.ts
│   │   ├── risk.ts
│   │   └── traffic.ts
│   ├── store/
│   │   └── useAppStore.ts
│   ├── utils/
│   │   └── formatters.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── .env.example
├── eslint.config.js
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Application flow

1. The user searches for a city or ZIP code.
2. Open-Meteo returns matching locations.
3. Zustand stores the selected location.
4. TanStack Query hooks load weather, housing, Census, employment, FEMA, college, and K-12 data as needed.
5. The Overview combines the map, weather, city snapshot, housing indicators, risk profile, and economic engine.
6. Category pages provide deeper visualizations and data-driven HomeIntel Briefs.
7. The Simulator reuses cached city data, applies synchronous deterministic calculations, and updates all results immediately as household assumptions change.
8. Simulator assumptions and checklist progress remain on the current device through `localStorage`.

## Data limitations

- The calculated current-year population assumes the linear trend fitted to the official 2023–2025 population levels continues through the current year.
- The 2019 People-chart value is an ACS estimate, while 2024 and 2025 come from the Population Estimates Program.
- ACS five-year values are survey estimates and currently omit margins of error in the UI.
- Census place, Zillow city, FEMA tract, and map geographies are not identical.
- LAUS city, QCEW county, QWI county, USAspending county, headquarters-radius, and hospital-radius geographies are not identical.
- USAspending contractor totals indicate regional federal work and do not prove that a company has an office or a specific employee count within 50 miles.
- Wikidata company records are community maintained and may omit branch offices, employee counts, or official websites.
- The HIFLD hospital feature service may have older or incomplete facility metadata; beds, staff, trauma status, and websites are shown only when reported.
- Zillow indices do not represent every individual property or lease.
- FEMA scores are relative community-screening measures, not parcel-level risk assessments.
- Weather is model based and can differ from a nearby station.
- U.S. federal datasets are unavailable for non-U.S. locations.
- Some Environment and Compare-page indicators remain illustrative and should not be presented as verified statistics.
- CCD covers public schools, not every private or commercial online program. State reporting completeness varies.
- A CCD virtual flag does not establish accreditation, tuition, admission eligibility, or current enrollment availability; verify those details with the school or state education agency.
- Online-school administrative addresses do not describe a student's attendance location, so the Online tab omits city-center distance.
- K-12 staffing ratios are not class sizes, test scores, ratings, or recommendations.
- Life Simulator outputs are planning estimates rather than tax, mortgage, utility, insurance, fuel-price, financial, employment, or relocation advice.
- State-level regional price parity is broader than a city or neighborhood and cannot represent every household's grocery, utility, or transportation costs.
- The Community fit dimension is a limited demographic proxy, not a measure of culture, belonging, compatibility, or quality of life.
- Career matching searches the available Census industry labels; it does not measure job openings, occupation-level demand, licensing requirements, or an individual's likelihood of employment.
- Readiness checklist completion records user progress only and does not verify that an external task was performed correctly.

## Environment and security

`.env` is ignored by Git. Never commit Census, Data.gov, BEA, or TomTom keys.

Variables prefixed with `VITE_` are included in browser code. FBI requests use a same-origin server proxy and the `DATA_GOV_API_KEY` server-only variable. For a static public deployment, implement the equivalent endpoint as a serverless function. Census requests still need a production proxy so that key is not exposed to browser users.

Zillow, Open-Meteo, OpenStreetMap, and FEMA requests used here do not require private application keys.

BLS LAUS/QCEW, Census QWI, USAspending, Wikidata, and the HIFLD hospital feature service do not require private application keys. `BEA_API_KEY` is optional and enables county real-GDP data.

`TOMTOM_API_KEY` is optional and remains server-side. It enables live traffic-aware travel time and typical rush-hour sampling. Without it, the commute planner automatically uses a clearly labeled OSRM baseline route. Both commute endpoints must be recreated alongside the other Vite proxies for a production static deployment.

The Urban Institute Education Data Portal / CCD school integration does not require an API key. Its proxy exists for response filtering, caching, request compatibility, and production control rather than secret management.

## Troubleshooting

### Census data says unavailable

- Confirm `.env` contains `VITE_CENSUS_API_KEY`.
- Restart Vite after editing `.env`.
- Confirm the selected location is in the United States.
- Verify the browser can reach `api.census.gov`.

### Zillow values fall back to ACS

The selected city may not exist in Zillow's city dataset. Run:

```bash
npm run data:update
```

### Map tiles do not display

- Confirm the browser can access `tile.openstreetmap.org`.
- Confirm `leaflet/dist/leaflet.css` remains imported in `src/main.tsx`.

### Weather or search fails

- Confirm the browser can access `open-meteo.com`.
- Check the browser network panel for blocked or rate-limited requests.

### Live traffic or transit options are unavailable

- Add `TOMTOM_API_KEY` to `.env`, then restart Vite to enable live and historical traffic-aware routing.
- Without a TomTom key, **Baseline routing** is expected and still provides road distance, route geometry, and a non-live duration.
- Select Start or Destination before clicking the map. The highlighted control shows which point the next click will move.
- Overpass transit records may be incomplete or temporarily rate limited. They represent mapped stops, not live schedules or a routed transit itinerary.
- The routing proxy caches results for two minutes; mapped transit stops are cached for 24 hours.

### Current unemployment says unavailable

- Restart Vite after changes to `vite.config.ts`; the current-economy proxy runs on the Vite server.
- Confirm the selected location is a U.S. city represented by BLS LAUS.
- The proxy automatically falls back from the BLS API to the official downloadable LAUS files when the API quota is exhausted.
- A single unavailable QCEW, QWI, or BEA provider should leave only its cards unavailable. If the entire request fails, check the FCC geography response and the server log for a timeout.
- Restarting the server clears the six-hour process-local cache; use a browser hard reload if a fresh HTTP-cached response is still being reused.

### Hospitals or regional employers are missing

- Restart Vite after proxy changes.
- Confirm the selected location is in the United States.
- Hospital results require qualifying open facilities within 50 miles and are limited to major facilities after bed/staff filtering.
- Ordinary company branch offices are not inferred. A company appears through qualifying federal contract activity or a nearby headquarters record.
- Employer sources settle independently. One missing source should not prevent results from the other two from appearing.
- Restarting the server clears the 24-hour process-local employer caches; use a browser hard reload if a fresh HTTP-cached response is still being reused.

### K-12 or online schools are missing

- Restart Vite after changing `vite.config.ts`; the school endpoint is Vite middleware.
- Confirm the selected location is a U.S. city and its state resolves to a postal and FIPS code.
- The first school request for a state can take longer because its open, regular 2024 CCD records are downloaded and cached. No school request is made until the K-12 section is opened.
- Local staffing-ranked tabs require active regular schools with coordinates, enrollment, and teacher FTE.
- The Online tab includes active regular public schools reported as fully virtual. Private programs and records missing the CCD virtual flag do not appear.
- A production static host must recreate `/api/nearby-schools` as a serverless or server endpoint.

## Quality checks

Run before committing:

```bash
npm test
npm run validate homeintel
```

`npm test` runs the pure calculation suite, including mortgage math, itemized-cost reconciliation, explainable deal-breaker failures, score bounds, household-consensus averaging, traffic-delay classification, and transit-stop proximity distance.

The validation command runs the following operations in sequence and stops immediately if
one fails:

1. `npm run data:update`
2. `npm run format:check`
3. `npm run lint`
4. `npm run build`
5. `npm audit`

## Photo credits

The landing-page images are stored locally in `src/assets/images` and sourced from Pexels. Light mode uses a sunny suburban home by Elena Golovchenko and a daylight living room by Karolina K. Dark mode uses residential homes at dusk by David Brown and a warmly lit living room by Clément Proust. Exact source-page links remain visible beneath the gallery. Keep those attributions when reusing the images.

## Attribution

- Zillow Research data requires Zillow attribution.
- OpenStreetMap requires contributor attribution.
- Census data is provided by the U.S. Census Bureau.
- FEMA National Risk Index data is provided by FEMA.
- Employment and wage data is provided by the U.S. Bureau of Labor Statistics.
- Federal contract data is provided by USAspending.gov.
- Company metadata is provided by Wikidata under CC0.
- Hospital facility records are provided by the U.S. Hospitals HIFLD feature service.
- Open-Meteo weather and geocoding are subject to Open-Meteo's terms.
- Landing imagery is subject to the Pexels license.

## License

HomeIntel's original source code is available under the [MIT License](LICENSE).

The MIT License applies to the project software only. Zillow, Census, FEMA,
OpenStreetMap, Open-Meteo, Pexels, and other third-party data or assets remain
subject to their respective licenses, attribution requirements, and terms.
