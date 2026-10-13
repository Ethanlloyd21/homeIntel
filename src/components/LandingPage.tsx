import { ClipboardCheck, Gauge, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import Brand from 'components/Brand'
import Header from 'components/Header'
import LandingAtlas from 'components/LandingAtlas'
import PublicResearchLinks from 'components/PublicResearchLinks'
import type { City } from 'data/cities'

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

const LandingPage = ({
  selectCity,
  theme,
  setTheme,
  onOpenPalette,
  children,
}: {
  selectCity: (city: City) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  onOpenPalette: () => void
  children?: ReactNode
}) => (
  <div className="app-shell location-entry landing-observatory">
    <main>
      <Header
        onMenu={() => undefined}
        theme={theme}
        onThemeChange={setTheme}
        onOpenPalette={onOpenPalette}
        variant="landing"
      />
      <div className="page-content landing-page">
        <LandingAtlas onStart={selectCity} />

        <div className="landing-sources">
          <span>
            <ShieldCheck size={13} aria-hidden="true" /> Built on public data
          </span>
          <ul>
            {sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>

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

        <PublicResearchLinks />

        <footer className="landing-footer">
          <Brand />
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
      </div>
    </main>
    {children}
  </div>
)

export default LandingPage
