import { BarChart3, Compass } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useEffect } from 'react'
import Brand from './components/Brand'
import Header from './components/Header'
import LandingGallery from './components/LandingGallery'
import SearchBox from './components/SearchBox'
import Sidebar from './components/Sidebar'
import CategoryPage from './pages/CategoryPage'
import ComparePage from './pages/ComparePage'
import OverviewPage from './pages/OverviewPage'
import { useAppStore, viewFromPath } from './store/useAppStore'

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

  useEffect(() => {
    const handlePopState = () => {
      useAppStore.setState({ view: viewFromPath(window.location.pathname) })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
                <p className="eyebrow">MOVE WITH CONFIDENCE</p>
                <h2>Compare cities. Choose where to call home.</h2>
                <span>
                  Research the places you are considering, compare what daily
                  life could cost, and understand each city before you move.
                </span>
                <label className="landing-search-label">
                  Start by researching a city
                </label>
                <SearchBox onSelect={selectCity} />
                <div className="landing-features">
                  <span>Housing costs</span>
                  <span>People &amp; jobs</span>
                  <span>Risk &amp; climate</span>
                  <span>Side-by-side comparison</span>
                </div>
                <p className="landing-next-step">
                  Search one city to open its full profile, then add another to
                  compare them side by side.
                </p>
              </div>
              <LandingGallery theme={theme} />
            </section>
            <p className="photo-credit">
              Light photos by{' '}
              <a
                href="https://www.pexels.com/photo/charming-suburban-home-in-spring-setting-32153568/"
                target="_blank"
                rel="noreferrer"
              >
                Elena Golovchenko
              </a>{' '}
              and{' '}
              <a
                href="https://www.pexels.com/photo/modern-cozy-living-room-interior-with-natural-light-30580637/"
                target="_blank"
                rel="noreferrer"
              >
                Karolina K
              </a>
              . Dark photos by{' '}
              <a
                href="https://www.pexels.com/photo/residential-buildings-on-the-hill-after-dusk-16811460/"
                target="_blank"
                rel="noreferrer"
              >
                David Brown
              </a>{' '}
              and{' '}
              <a
                href="https://www.pexels.com/photo/modern-cozy-living-room-with-warm-lighting-29532546/"
                target="_blank"
                rel="noreferrer"
              >
                Clément Proust
              </a>{' '}
              on Pexels
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
              right={comparisonCity}
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
