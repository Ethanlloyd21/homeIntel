import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'leaflet/dist/leaflet.css'
import App from 'App'
import ErrorBoundary from 'components/ErrorBoundary'
import ScrollToTop from 'components/ScrollToTop'
import PublicPage from 'pages/PublicPage'
import type { PublicData } from 'data/publicCities'
import { applyMetadata, publicPageAt } from 'utils/seo'
import 'styles.css'
import 'assets/atlas.css'
import 'assets/research.css'
import 'assets/consistency.css'
import 'assets/mobile.css'
import 'assets/public.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const publicPage = publicPageAt(window.location.pathname)
let publicData: PublicData = { markets: [] }
try {
  publicData = JSON.parse(
    document.getElementById('public-page-data')?.textContent ||
      '{"markets":[]}',
  )
} catch {
  /* A missing preview snapshot does not block the app. */
}
if (publicData.markets.length) {
  // Render the build snapshot immediately, then refresh the full local dataset.
  queryClient.setQueryData(['landing-zillow-markets'], publicData, {
    updatedAt: 0,
  })
}
applyMetadata(window.location.pathname)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {publicPage ? (
          <PublicPage pathname={window.location.pathname} data={publicData} />
        ) : (
          <App />
        )}
        <ScrollToTop />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>,
)
