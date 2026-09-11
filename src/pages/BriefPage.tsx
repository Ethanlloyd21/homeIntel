import {
  AlertTriangle,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Compass,
  FileText,
  HelpCircle,
  Luggage,
  MapPinned,
  Printer,
  ShieldQuestion,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useMemo } from 'react'
import CitySelect from 'components/CitySelect'
import LoadingSpinner from 'components/LoadingSpinner'
import PageHeader from 'components/PageHeader'
import PanelCard from 'components/PanelCard'
import ScoreDial from 'components/ScoreDial'
import SourceChip from 'components/SourceChip'
import type { City } from 'data/cities'
import { useDecision } from 'hooks/useDecision'
import { regretLevelLabel, type RegretFactor } from 'services/regret'
import { buildTestDrivePlan } from 'services/testDrive'
import { useProfileStore } from 'store/useProfileStore'
import { money } from 'utils/formatters'

const verdictTone: Record<string, 'good' | 'caution' | 'alert' | 'neutral'> = {
  'strong-fit': 'good',
  workable: 'neutral',
  'needs-caution': 'caution',
  'poor-fit': 'alert',
}

const regretTone: Record<string, 'good' | 'caution' | 'alert' | 'neutral'> = {
  low: 'good',
  moderate: 'neutral',
  elevated: 'caution',
  high: 'alert',
}

const FactorRow = ({ factor }: { factor: RegretFactor }) => (
  <details className={`regret-factor regret-${factor.level}`}>
    <summary>
      <span className="regret-factor-name">
        <b>{factor.label}</b>
        <small>{factor.headline}</small>
      </span>
      <span className="regret-factor-meter" aria-hidden="true">
        <i
          style={{
            width: `${factor.basis === 'unavailable' ? 0 : factor.risk}%`,
          }}
        />
      </span>
      <span className="regret-factor-level">
        {factor.basis === 'unavailable'
          ? 'Not assessed'
          : regretLevelLabel[factor.level]}
      </span>
      <ChevronRight size={15} aria-hidden="true" />
    </summary>
    <ul>
      {factor.evidence.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  </details>
)

const BriefPage = ({ city }: { city: City }) => {
  const originCity = useProfileStore((state) => state.originCity)
  const setOriginCity = useProfileStore((state) => state.setOriginCity)
  const inputs = useProfileStore((state) => state.inputs)
  const dealBreakers = useProfileStore((state) => state.dealBreakers)
  const shortlist = useProfileStore((state) => state.shortlist)
  const toggleShortlist = useProfileStore((state) => state.toggleShortlist)
  const decision = useDecision(city)

  const shortlisted = shortlist.some((entry) => entry.id === city.id)

  const testDrive = useMemo(() => {
    if (!decision) return null
    return buildTestDrivePlan({
      cityName: city.name,
      destination: decision.intel.data,
      climate: decision.intel.climate,
      regret: decision.regret,
      inputs,
      dealBreakers,
      nearestSchoolName: null,
      nearestHospitalName: decision.intel.nearestHospital?.name ?? null,
      topEmployers: decision.intel.topEmployers,
    })
  }, [decision, city.name, inputs, dealBreakers])

  if (!decision || !testDrive) {
    return (
      <div className="brief-page">
        <LoadingSpinner size={40} label="Building your decision brief" />
      </div>
    )
  }

  const { brief, regret, simulation, intel } = decision

  return (
    <div className="brief-page">
      <PageHeader
        eyebrow="DECISION BRIEF"
        icon={FileText}
        title={
          <>
            Should you move to {city.name}
            {city.state ? `, ${city.state}` : ''}?
          </>
        }
        description="A structured answer built only from your inputs and the sources listed against every line. Nothing here is generated text."
        actions={
          <>
            <button
              type="button"
              className={`pill-button ${shortlisted ? 'active' : ''}`}
              onClick={() => toggleShortlist(city)}
            >
              <Star size={15} fill={shortlisted ? 'currentColor' : 'none'} />
              {shortlisted ? 'Shortlisted' : 'Add to shortlist'}
            </button>
            <button
              type="button"
              className="pill-button"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Print brief
            </button>
          </>
        }
      />

      {!originCity && (
        <section className="card origin-prompt">
          <div>
            <span>
              <MapPinned size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>Tell us where you live now</strong>
              <p>
                Four of the ten regret factors — housing shock, salary
                adjustment, climate mismatch, and distance from your support
                network — can only be measured against your current city.
              </p>
            </div>
          </div>
          <CitySelect
            value={null}
            onChange={setOriginCity}
            placeholder="Search your current city"
          />
        </section>
      )}

      <section className={`card verdict-card verdict-${brief.verdict}`}>
        <div className="verdict-main">
          <p className="eyebrow">VERDICT</p>
          <h3>{brief.verdictLabel}</h3>
          <p className="verdict-line">{brief.verdictLine}</p>
          <div className="verdict-meta">
            <span>
              <small>Data confidence</small>
              <b>{brief.confidence}</b>
            </span>
            <span>
              <small>Regret factors assessed</small>
              <b>
                {regret.assessed.length} of {regret.factors.length}
              </b>
            </span>
            {brief.monthlyDelta !== null && (
              <span>
                <small>Monthly cash difference</small>
                <b className={brief.monthlyDelta >= 0 ? 'up' : 'down'}>
                  {brief.monthlyDelta >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {money(Math.round(Math.abs(brief.monthlyDelta)))}
                  {brief.monthlyDelta >= 0 ? ' kept' : ' more'}
                </b>
              </span>
            )}
          </div>
          <p className="verdict-confidence-note">{brief.confidenceReason}</p>
        </div>
        <div className="verdict-dials">
          <ScoreDial
            score={simulation.fitScore}
            label="City fit"
            caption="Weighted to your priorities"
            tone={verdictTone[brief.verdict]}
          />
          <ScoreDial
            score={regret.score}
            label="Regret risk"
            caption={regretLevelLabel[regret.level]}
            tone={regretTone[regret.level]}
          />
        </div>
      </section>

      <div className="brief-columns">
        <PanelCard
          eyebrow="WHY IT FITS"
          title="What works in your favour"
          icon={Check}
          className="brief-fits"
        >
          {brief.fits.length ? (
            <ul className="statement-list">
              {brief.fits.map((statement) => (
                <li key={statement.text}>
                  <p>{statement.text}</p>
                  <SourceChip source={statement.source} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">
              Nothing in this city stands out as an advantage at your current
              assumptions.
            </p>
          )}
        </PanelCard>

        <PanelCard
          eyebrow="WHY IT MIGHT NOT"
          title="What would have to be solved"
          icon={AlertTriangle}
          className="brief-concerns"
        >
          {brief.concerns.length ? (
            <ul className="statement-list">
              {brief.concerns.map((statement) => (
                <li key={statement.text}>
                  <p>{statement.text}</p>
                  <SourceChip source={statement.source} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">
              No material concern was detected across the assessed factors.
            </p>
          )}
        </PanelCard>
      </div>

      <PanelCard
        eyebrow="REGRET CHECK"
        title="Where regret would come from"
        icon={ShieldQuestion}
        action={<SourceChip source={regret.summary} level="Medium" />}
        className="regret-card"
      >
        <p className="panel-lede">{regret.summary}</p>
        <div className="regret-factors">
          {[...regret.assessed]
            .sort((first, second) => second.risk - first.risk)
            .map((factor) => (
              <FactorRow key={factor.key} factor={factor} />
            ))}
        </div>
        {regret.unavailable.length > 0 && (
          <div className="regret-unassessed">
            <strong>
              {regret.unavailable.length} factor
              {regret.unavailable.length === 1 ? '' : 's'} could not be assessed
            </strong>
            <ul>
              {regret.unavailable.map((factor) => (
                <li key={factor.key}>
                  <b>{factor.label}.</b> {factor.evidence[0]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </PanelCard>

      <div className="brief-sections">
        {brief.sections.map((section) => (
          <PanelCard
            key={section.key}
            eyebrow="BRIEF"
            title={section.title}
            icon={ClipboardList}
            className="brief-section-card"
          >
            <ul className="statement-list">
              {section.statements.map((statement) => (
                <li key={statement.text}>
                  <p>{statement.text}</p>
                  <SourceChip source={statement.source} />
                </li>
              ))}
            </ul>
          </PanelCard>
        ))}
      </div>

      <PanelCard
        eyebrow="BEFORE YOU DECIDE"
        title="Questions to answer on the ground"
        icon={HelpCircle}
        className="brief-questions"
      >
        <ol className="question-list">
          {brief.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </PanelCard>

      <PanelCard
        eyebrow="TEST-DRIVE THIS CITY"
        title="A three-day research trip, not a holiday"
        icon={Luggage}
        className="testdrive-card"
        action={
          <span className="testdrive-window">
            <CalendarCheck size={14} /> Visit in {testDrive.whenToVisit.window}
          </span>
        }
      >
        <p className="panel-lede">{testDrive.whenToVisit.reason}</p>
        <div className="testdrive-days">
          {testDrive.days.map((day) => (
            <div key={day.key} className="testdrive-day">
              <div className="testdrive-day-head">
                <h4>{day.label}</h4>
                <p>{day.focus}</p>
              </div>
              <ol>
                {day.stops.map((stop) => (
                  <li key={stop.id}>
                    <span className="testdrive-time">{stop.time}</span>
                    <div>
                      <strong>{stop.title}</strong>
                      <p>{stop.purpose}</p>
                      <p className="testdrive-check">
                        <Compass size={13} aria-hidden="true" /> {stop.check}
                      </p>
                      <span className="testdrive-resolves">
                        {stop.resolves}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="testdrive-packing">
          <strong>Take with you</strong>
          <ul>
            {testDrive.packing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{testDrive.budgetNote}</p>
        </div>
      </PanelCard>

      <PanelCard
        eyebrow="DATA CONFIDENCE"
        title="What each conclusion rests on"
        icon={ClipboardList}
        className="confidence-card"
      >
        <div className="confidence-table">
          {intel.confidence.map((entry) => (
            <div key={entry.label}>
              <span>
                <strong>{entry.label}</strong>
                <small>{entry.note}</small>
              </span>
              <em>{entry.geography}</em>
              <SourceChip
                source={entry.note}
                detail={`Geography: ${entry.geography}.`}
                level={entry.level}
              />
            </div>
          ))}
        </div>
      </PanelCard>

      <p className="simulator-disclaimer">
        Generated {new Date(brief.generatedAt).toLocaleString()} from your saved
        household profile. This is a planning document, not financial, tax,
        insurance, employment, or relocation advice.
      </p>
    </div>
  )
}

export default BriefPage
