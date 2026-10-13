import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from 'components/LandingPage'
import PublicPage from 'pages/PublicPage'
import type { PublicData } from 'data/publicCities'
import {
  metadataForPath,
  publicPageAt,
  structuredDataForPath,
  siteUrl,
} from 'utils/seo'
import { cityGuidePath, publicCities } from 'data/publicCities'
import { viewPaths } from 'utils/routes'

export { metadataForPath, structuredDataForPath, siteUrl }
export { publicCities }
export const publicPaths = [
  '/',
  '/cities/',
  '/about/',
  ...publicCities.map(cityGuidePath),
]
export const workspacePaths = Object.values(viewPaths)

export const renderPage = (pathname: string, data: PublicData) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['landing-zillow-markets'], data)
  const noop = () => undefined
  try {
    return renderToString(
      <QueryClientProvider client={client}>
        {pathname === '/' ? (
          <LandingPage
            selectCity={noop}
            theme="light"
            setTheme={noop}
            onOpenPalette={noop}
          />
        ) : publicPageAt(pathname) ? (
          <PublicPage pathname={pathname} data={data} />
        ) : null}
      </QueryClientProvider>,
    )
  } finally {
    client.clear()
  }
}
