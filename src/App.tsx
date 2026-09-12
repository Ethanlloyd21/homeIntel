import {
  BarChart3,
  ClipboardCheck,
  Compass,
  Gauge,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useEffect, useState } from 'react'
import Brand from 'components/Brand'
import CommandPalette from 'components/CommandPalette'
import Header from 'components/Header'
import LandingAtlas from 'components/LandingAtlas'
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
import { useAppStore, viewFromPath } from 'store/useAppStore'
import { useProfileStore } from 'store/useProfileStore'

const sources = [
  'Census',
  'FEMA',
  'Zillow',
  'BEA',
  'BLS',
  'NCES',
  'HIFLD',
  'Open-Meteo',
]

const proofPoints = [
  { value: '10', label: 'regret factors scored' },
  { value: '10', label: 'monthly cost lines itemised' },
  { value: '5', label: 'decision tools' },
  { value: '90', label: 'day move timeline' },
]

const steps = [
  {
    icon: Gauge,
    title: 'Simulate the money',
    body: 'Taxes, housing, utilities, transport, childcare, healthcare and a hazard reserve — itemised, with the formula behind every line.',
    tools: ['Life simulator', 'Day in your life'],
  },
  {
    icon: ShieldCheck,
    title: 'Check for regret',
    body: 'Ten explainable factors, from housing shock and salary adjustment to climate mismatch, reported crime, and distance from the people you rely on.',
    tools: ['Regret check', 'Decision brief'],
  },
  {
    icon: ClipboardCheck,
    title: 'Plan the move',
    body: 'A research-trip itinerary for the hard season, a real move budget, and a 90-day timeline you can tick off.',
    tools: ['Move plan'],
  },
]

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
      useAppStore.setState({ view: viewFromPath(window.location.pathname) })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
      <div className="app-shell location-entry landing-observatory">
        <main>
          <Header
            onMenu={() => undefined}
            theme={theme}
            onThemeChange={setTheme}
            onOpenPalette={() => setPaletteOpen(true)}
            variant="landing"
          />
          <div className="page-content landing-page">
            <LandingAtlas onStart={selectCity} />

            <div className="landing-sources">
              <span>
                <ShieldCheck size={13} aria-hidden="true" /> Built on public
                data
              </span>
              <ul>
                {sources.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>

            <section
              className="landing-proof"
              aria-label="What HomeIntel measures"
            >
              {proofPoints.map((point) => (
                <div key={point.label}>
                  <strong>{point.value}</strong>
                  <span>{point.label}</span>
                </div>
              ))}
            </section>

            <section className="landing-steps">
              <div className="landing-section-head">
                <p className="eyebrow">FROM POSSIBILITY TO A PLAN</p>
                <h3>A new place. The whole picture.</h3>
              </div>
              <ol>
                {steps.map(({ icon: Icon, title, body, tools }, index) => (
                  <li key={title}>
                    <span className="landing-step-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="landing-step-icon" aria-hidden="true">
                      <Icon size={19} />
                    </span>
                    <h4>{title}</h4>
                    <p>{body}</p>
                    <div className="landing-step-tools">
                      {tools.map((tool) => (
                        <span key={tool}>{tool}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <footer className="landing-footer">
              <Brand />
              <p className="photo-credit">
                U.S. map boundaries via{' '}
                <a
                  href="https://github.com/topojson/us-atlas"
                  target="_blank"
                  rel="noreferrer"
                >
                  U.S. Atlas
                </a>
                .
              </p>
              <span>HomeIntel &copy; 2026</span>
            </footer>
          </div>
        </main>
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
          <p>
            Every figure is traced to a named public source. Calculations are
            deterministic planning estimates, not professional advice.
          </p>
          <span>HomeIntel © 2026</span>
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
