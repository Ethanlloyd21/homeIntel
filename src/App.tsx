import { BarChart3, Compass } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useEffect } from 'react'
import suburbanNeighborhood from './assets/images/suburban-neighborhood.jpg'
import urbanNeighborhood from './assets/images/urban-neighborhood.jpg'
import Brand from './components/Brand'
import Header from './components/Header'
import SearchBox from './components/SearchBox'
import Sidebar from './components/Sidebar'
import CategoryPage from './pages/CategoryPage'
import ComparePage from './pages/ComparePage'
import OverviewPage from './pages/OverviewPage'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const view = useAppStore((state) => state.view)
  const city = useAppStore((state) => state.city)
  const comparisonCity = useAppStore((state) => state.comparisonCity)
  const mobileNavOpen = useAppStore((state) => state.mobileNavOpen)
  const theme = useAppStore((state) => state.theme)
  const setView = useAppStore((state) => state.setView)
  const selectCity = useAppStore((state) => state.selectCity)
  const setComparisonCity = useAppStore((state) => state.setComparisonCity)
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen)
  const setTheme = useAppStore((state) => state.setTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  if (!city) {
    return (
      <div className="app-shell location-entry">
        <main>
          <Header
            onMenu={() => undefined}
            theme={theme}
            onThemeChange={setTheme}
          />
          <div className="page-content landing-page">
            <section className="landing-hero">
              <div className="landing-copy">
                <p className="eyebrow">EXPLORE WITH CONFIDENCE</p>
                <h2>Find the place that feels right.</h2>
                <span>
                  Explore live maps, current weather, and useful local context
                  for cities around the world.
                </span>
                <SearchBox onSelect={selectCity} />
                <div className="landing-features">
                  <span>Live weather</span>
                  <span>Interactive maps</span>
                  <span>Worldwide search</span>
                </div>
              </div>
              <div className="landing-gallery" aria-label="Neighborhood views">
                <figure className="landing-photo landing-photo-main">
                  <img
                    src={urbanNeighborhood}
                    alt="Aerial view of a colorful urban neighborhood"
                  />
                  <figcaption>Understand the whole neighborhood</figcaption>
                </figure>
                <figure className="landing-photo landing-photo-secondary">
                  <img
                    src={suburbanNeighborhood}
                    alt="Aerial view of a suburban neighborhood and winding roads"
                  />
                  <figcaption>See how places connect</figcaption>
                </figure>
              </div>
            </section>
            <p className="photo-credit">
              Photos by Kelly and Pavel Danilyuk on{' '}
              <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
                Pexels
              </a>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        setActive={setView}
        open={mobileNavOpen}
        close={() => setMobileNavOpen(false)}
      />
      <main>
        <Header
          onMenu={() => setMobileNavOpen(true)}
          theme={theme}
          onThemeChange={setTheme}
        />
        <Tabs.Root
          className="top-tabs"
          value={view === 'Compare' ? 'compare' : 'explore'}
          onValueChange={(value) =>
            setView(value === 'compare' ? 'Compare' : 'Overview')
          }
        >
          <Tabs.List className="top-tabs-list" aria-label="Workspace view">
            <Tabs.Trigger value="explore">
              <Compass size={15} /> Explore
            </Tabs.Trigger>
            <Tabs.Trigger value="compare">
              <BarChart3 size={15} /> Compare cities
            </Tabs.Trigger>
          </Tabs.List>
          <span />
          <div className="selected-location">
            <i style={{ background: city.color }} />
            <span>
              {city.name}, {city.state}
            </span>
            <SearchBox onSelect={selectCity} />
          </div>
        </Tabs.Root>
        <div className="page-content">
          {view === 'Overview' ? (
            <OverviewPage city={city} setView={setView} />
          ) : view === 'Compare' ? (
            <ComparePage
              left={city}
              right={comparisonCity ?? city}
              setLeft={selectCity}
              setRight={setComparisonCity}
            />
          ) : (
            <CategoryPage type={view} city={city} />
          )}
        </div>
        <footer>
          <Brand />
          <p>
            Data shown is illustrative. Connect Census, FEMA, NOAA and USGS APIs
            for production.
          </p>
          <span>HomeIntel Â© 2026</span>
        </footer>
      </main>
      {mobileNavOpen && (
        <div className="scrim" onClick={() => setMobileNavOpen(false)} />
      )}
    </div>
  )
}
