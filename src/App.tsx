import { BarChart3, Compass, Route } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useEffect, useState } from 'react'
import Brand from 'components/Brand'
import CommandPalette from 'components/CommandPalette'
import Header from 'components/Header'
import LandingPage from 'components/LandingPage'
import SearchBox from 'components/SearchBox'
import Sidebar from 'components/Sidebar'
import BriefPage from 'pages/BriefPage'
import CategoryPage from 'pages/CategoryPage'
import ComparePage from 'pages/ComparePage'
import DayInLifePage from 'pages/DayInLifePage'
import LifeSimulatorPage from 'pages/LifeSimulatorPage'
import MovePlanPage from 'pages/MovePlanPage'
import NeighborhoodPage from 'pages/NeighborhoodPage'
import OverviewPage from 'pages/OverviewPage'
import { useAppStore } from 'store/useAppStore'
import { useProfileStore } from 'store/useProfileStore'
import { applyMetadata } from 'utils/seo'

const decideViews = new Set([
  'Simulator',
  'DayInLife',
  'Brief',
  'MovePlan',
  'Neighborhoods',
])

const App = () => {
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
  const clearCity = useAppStore((state) => state.clearCity)
  const resetSelection = useAppStore((state) => state.resetSelection)
  const setOriginCity = useProfileStore((state) => state.setOriginCity)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const handlePopState = () => {
      useAppStore.getState().syncLocation()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    applyMetadata(
      window.location.pathname,
      city ? `${city.name}, ${city.state}` : undefined,
    )
  }, [view, city])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  /**
   * Clears the whole route — where they are moving from, to, and any comparison
   * city — and returns to the landing search. The household profile, shortlist,
   * and saved progress are deliberately kept: those are work, not a selection.
   */
  const startOver = () => {
    setOriginCity(null)
    resetSelection()
  }

  if (!city) {
    return (
      <LandingPage
        selectCity={selectCity}
        theme={theme}
        setTheme={setTheme}
        onOpenPalette={() => setPaletteOpen(true)}
      >
        {paletteOpen && (
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            setView={setView}
            selectCity={selectCity}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </LandingPage>
    )
  }

  const workspaceTab = decideViews.has(view)
    ? 'decide'
    : view === 'Compare'
      ? 'compare'
      : 'explore'

  const renderView = () => {
    switch (view) {
      case 'Overview':
        return <OverviewPage city={city} setView={setView} />
      case 'Simulator':
        return (
          <LifeSimulatorPage
            city={city}
            comparisonCity={comparisonCity}
            setComparisonCity={setComparisonCity}
          />
        )
      case 'DayInLife':
        return <DayInLifePage city={city} />
      case 'Brief':
        return <BriefPage city={city} />
      case 'MovePlan':
        return (
          <MovePlanPage city={city} setView={setView} selectCity={selectCity} />
        )
      case 'Neighborhoods':
        return (
          <NeighborhoodPage
            city={city}
            comparisonCity={comparisonCity}
            setComparisonCity={setComparisonCity}
          />
        )
      case 'Compare':
        return (
          <ComparePage
            left={city}
            right={comparisonCity}
            setLeft={selectCity}
            setRight={setComparisonCity}
          />
        )
      default:
        return <CategoryPage type={view} city={city} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        setActive={setView}
        open={mobileNavOpen}
        close={() => setMobileNavOpen(false)}
        city={city}
        onReset={startOver}
        onClearDestination={clearCity}
        onSelectDestination={selectCity}
      />
      <main>
        <Header
          onMenu={() => setMobileNavOpen(true)}
          menuOpen={mobileNavOpen}
          theme={theme}
          onThemeChange={setTheme}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <Tabs.Root
          className="top-tabs"
          value={workspaceTab}
          onValueChange={(value) =>
            setView(
              value === 'compare'
                ? 'Compare'
                : value === 'decide'
                  ? 'Brief'
                  : 'Overview',
            )
          }
        >
          <Tabs.List className="top-tabs-list" aria-label="Workspace view">
            <Tabs.Trigger value="explore">
              <Compass size={15} /> Explore
            </Tabs.Trigger>
            <Tabs.Trigger value="decide">
              <Route size={15} /> Decide
            </Tabs.Trigger>
            <Tabs.Trigger value="compare">
              <BarChart3 size={15} /> Compare
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
        <div className="page-content">{renderView()}</div>
        <footer>
          <Brand onReset={startOver} />
          <span className="footer-copyright">
            <a
              href="https://lloydmarcelino.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              lloydmarcelino.com
            </a>{' '}
            &copy; 2026
          </span>
        </footer>
      </main>
      {mobileNavOpen && (
        <div className="scrim" onClick={() => setMobileNavOpen(false)} />
      )}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          setView={setView}
          selectCity={selectCity}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}
    </div>
  )
}

export default App
