# HomeIntel

HomeIntel is a React and TypeScript location-intelligence dashboard. Users search for a city and receive housing, population, employment, weather, mapping, and natural-hazard information from public data sources.

The application does not start with a hard-coded city. The selected and comparison cities are stored in Zustand, while remote data is loaded and cached through TanStack Query.

## Features

- Worldwide city and ZIP-code search through Open-Meteo
- Interactive Leaflet map with OpenStreetMap tiles
- Live weather, daily high/low, humidity, and wind
- Zillow ZHVI typical home values and ZORI market rents
- Census ACS housing, demographic, education, and employment indicators
- Census Vintage 2025 city population estimates
- Calculated current-year population based on the official 2024–2025 city growth rate
- FEMA National Risk Index profile and individual hazard scores
- Housing, People, Employment, Risk, and Environment pages
- Housing and demographic visualizations
- Data-driven HomeIntel Briefs for Housing and People
- Side-by-side city comparison interface
- Responsive desktop and mobile layouts
- Material UI loading indicators
- ESLint and Prettier integration

## Technology

- React
- TypeScript
- Vite
- Zustand
- TanStack Query
- Material UI
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

Copy `.env.example` to `.env` and provide the Census key:

```env
VITE_CENSUS_API_KEY=your_census_api_key
```

Request a key at <https://api.census.gov/data/key_signup.html>.

Start the application:

```bash
npm run dev
```

Vite normally serves the application at `http://localhost:5173`. Restart the development server after changing `.env`.

## Commands

| Command                   | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `npm run dev`             | Start the Vite development server                 |
| `npm run build`           | Type-check and create a production build          |
| `npm run preview`         | Preview the production build                      |
| `npm run lint`            | Run ESLint                                        |
| `npm run lint:fix`        | Fix supported ESLint issues                       |
| `npm run format`          | Format the repository with Prettier               |
| `npm run format:check`    | Check formatting without editing files            |
| `npm run data:update`     | Refresh the normalized Zillow Research dataset    |
| `npm run build:with-data` | Refresh Zillow data and create a production build |

## Data sources

### Open-Meteo

Open-Meteo provides two keyless services:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Weather: `https://api.open-meteo.com/v1/forecast`

The weather request uses the selected coordinates and includes temperature, apparent temperature, humidity, weather code, wind speed, and daily high/low in local time.

### OpenStreetMap

The selected location is rendered with React Leaflet and OpenStreetMap tiles. Required map attribution remains visible.

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
| `B25003_002E` | Owner-occupied housing units         |
| `B25003_003E` | Renter-occupied housing units        |
| `B25077_001E` | Median owner-occupied home value     |
| `B25064_001E` | Median gross rent                    |

Employment industries and median worker earnings come from the ACS DP03 Selected Economic Characteristics profile. The Economic Engine card displays the leading local industries and uses the Census professional/scientific category for “Technology & professional services.”

### Census Vintage 2025 population estimates

The official Census Vintage 2025 incorporated-place table supplies point estimates for 2024 and 2025. The normalized local lookup contains approximately 19,500 incorporated places:

```text
public/data/census-population-2025.json
```

HomeIntel calculates the current-year value by measuring the official 2024–2025 one-year rate and applying it once to 2025:

```text
annual rate = (population 2025 - population 2024) / population 2024
population 2026 = population 2025 * (1 + annual rate)
```

The 2026 result is a HomeIntel calculation, not an official Census estimate. The interface labels it accordingly. If the selected location does not match an incorporated place in the Vintage 2025 table, the application keeps the 2024 ACS value and explains that the 2025 city estimate was unavailable.

The People chart compares the 2019 ACS estimate with the calculated current-year value. These are different Census series, so the comparison is useful for broad context but should not be treated as a precise official time series.

Source: <https://www.census.gov/newsroom/press-kits/2026/vintage-2025-city-town-pop-estimates.html>

### FEMA National Risk Index

The Risk Profile uses FEMA's December 2025 National Risk Index Census-tract layer. The selected city's longitude and latitude identify the containing tract. HomeIntel displays:

- Composite risk score and rating
- Highest individual natural-hazard scores
- Inland-flooding score
- Community-resilience score and rating

Risk Index values are relative screening measures, not property-level forecasts or insurance determinations. FEMA risk data is available only for U.S. locations.

Source: <https://hazards.fema.gov/nri/>

## State and API architecture

### Zustand

`src/store/useAppStore.ts` stores client state:

- Active page
- Selected city
- Comparison city
- Mobile-navigation state

API responses are not stored in Zustand.

### TanStack Query hooks

All React Query configuration is centralized in `src/hooks`:

- `useLocationSearchQuery.ts`
- `useWeatherQuery.ts`
- `useHousingQuery.ts`
- `useDemographicsQuery.ts`
- `useEmploymentQuery.ts`
- `useRiskQuery.ts`

The hooks own query keys, cancellation signals, enabling conditions, and stale times. UI components consume the hooks without containing direct `useQuery` or API `fetch` calls.

The shared `QueryClient` is configured in `src/main.tsx`.

## Project structure

```text
homeIntel/
├── .github/workflows/
│   └── update-zillow-data.yml
├── public/data/
│   ├── census-population-2025.json
│   └── zillow-market.json
├── scripts/
│   └── update-zillow-data.mjs
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
│   │   └── WeatherCard.tsx
│   ├── data/
│   │   └── cities.ts
│   ├── hooks/
│   │   ├── useDemographicsQuery.ts
│   │   ├── useEmploymentQuery.ts
│   │   ├── useHousingQuery.ts
│   │   ├── useLocationSearchQuery.ts
│   │   ├── useRiskQuery.ts
│   │   └── useWeatherQuery.ts
│   ├── pages/
│   │   ├── CategoryPage.tsx
│   │   ├── ComparePage.tsx
│   │   └── OverviewPage.tsx
│   ├── services/
│   │   ├── demographics.ts
│   │   ├── employment.ts
│   │   ├── housing.ts
│   │   └── risk.ts
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
4. TanStack Query hooks load weather, housing, Census, employment, and FEMA data as needed.
5. The Overview combines the map, weather, city snapshot, housing indicators, risk profile, and economic engine.
6. Category pages provide deeper visualizations and data-driven HomeIntel Briefs.

## Data limitations

- The calculated current-year population assumes the 2024–2025 city rate repeats for one year.
- The 2019 People-chart value is an ACS estimate, while 2024 and 2025 come from the Population Estimates Program.
- ACS five-year values are survey estimates and currently omit margins of error in the UI.
- Census place, Zillow city, FEMA tract, and map geographies are not identical.
- Zillow indices do not represent every individual property or lease.
- FEMA scores are relative community-screening measures, not parcel-level risk assessments.
- Weather is model based and can differ from a nearby station.
- U.S. federal datasets are unavailable for non-U.S. locations.
- Some Environment and Compare-page indicators remain illustrative and should not be presented as verified statistics.

## Environment and security

`.env` is ignored by Git. Never commit the Census key.

Variables prefixed with `VITE_` are included in browser code. For a public deployment, proxy Census requests through a server or serverless function so the key is not exposed to browser users.

Zillow, Open-Meteo, OpenStreetMap, and FEMA requests used here do not require private application keys.

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

## Quality checks

Run before committing:

```bash
npm run format:check
npm run lint
npm run build
npm audit
```

## Photo credits

The landing-page images are stored locally in `src/assets/images` and sourced from Pexels. Keep the visible Pexels attribution when reusing them.

## Attribution

- Zillow Research data requires Zillow attribution.
- OpenStreetMap requires contributor attribution.
- Census data is provided by the U.S. Census Bureau.
- FEMA National Risk Index data is provided by FEMA.
- Open-Meteo weather and geocoding are subject to Open-Meteo's terms.
- Landing imagery is subject to the Pexels license.

No project-level software license has been added. Add one before distributing the project as open-source software.
