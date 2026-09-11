import {
  CalendarDays,
  CircleDollarSign,
  ListChecks,
  Route,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import LoadingSpinner from 'components/LoadingSpinner'
import PageHeader from 'components/PageHeader'
import PanelCard from 'components/PanelCard'
import type { City } from 'data/cities'
import { useDecision } from 'hooks/useDecision'
import {
  buildMoveBudget,
  buildMoveTasks,
  movePhases,
  type MoveTaskPhase,
} from 'services/movePlan'
import { useProfileStore } from 'store/useProfileStore'
import { money } from 'utils/formatters'

const categoryTone: Record<string, string> = {
  Money: 'money',
  Housing: 'housing',
  Logistics: 'logistics',
  Admin: 'admin',
  Family: 'family',
  Work: 'work',
}

// Stable fallbacks: a selector that builds a fresh [] or {} on every read makes
// zustand's snapshot comparison fail and re-render forever.
const noTasks: string[] = []
const noOverrides: Record<string, number> = {}

const MovePlanPage = ({
  city,
  setView,
  selectCity,
}: {
  city: City
  setView: (view: string) => void
  selectCity: (city: City) => void
}) => {
  const inputs = useProfileStore((state) => state.inputs)
  const shortlist = useProfileStore((state) => state.shortlist)
  const toggleShortlist = useProfileStore((state) => state.toggleShortlist)
  const completed =
    useProfileStore((state) => state.moveTasks[city.id]) ?? noTasks
  const toggleMoveTask = useProfileStore((state) => state.toggleMoveTask)
  const overrides =
    useProfileStore((state) => state.budgetOverrides[city.id]) ?? noOverrides
  const setBudgetOverride = useProfileStore((state) => state.setBudgetOverride)
  const decision = useDecision(city)

  const tasks = useMemo(
    () => buildMoveTasks(inputs, city.name),
    [inputs, city.name],
  )

  const budget = useMemo(() => {
    const housing =
      decision?.simulation.costs.find((cost) => cost.key === 'housing')
        ?.value ?? 0
    return buildMoveBudget(
      inputs,
      housing,
      decision?.supportNetworkMiles ?? null,
      overrides,
    )
  }, [inputs, decision, overrides])

  if (!decision) {
    return (
      <div className="moveplan-page">
        <LoadingSpinner size={40} label="Loading your move plan" />
      </div>
    )
  }

  const doneCount = tasks.filter((task) => completed.includes(task.id)).length
  const progress = (doneCount / tasks.length) * 100

  return (
    <div className="moveplan-page">
      <PageHeader
        eyebrow="MOVE PLAN"
        icon={Route}
        title={<>Turn {city.name} into a plan you can execute</>}
        description="A shortlist, a real move budget, and a 90-day timeline generated from the household you described."
        actions={
          <span className="progress-pill">
            <ListChecks size={15} /> {doneCount} of {tasks.length} done
          </span>
        }
      />

      <div className="moveplan-progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="moveplan-grid">
        <PanelCard
          eyebrow="SHORTLIST"
          title="Cities you are still considering"
          icon={Star}
          className="shortlist-card"
        >
          {shortlist.length ? (
            <div className="shortlist-rows">
              {shortlist.map((entry) => (
                <div
                  key={entry.id}
                  className={entry.id === city.id ? 'active' : ''}
                >
                  <button
                    type="button"
                    className="shortlist-open"
                    onClick={() => {
                      selectCity(entry)
                      setView('Brief')
                    }}
                  >
                    <i style={{ background: entry.color }} />
                    <span>
                      <strong>{entry.name}</strong>
                      <small>{entry.state}</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.name} from shortlist`}
                    className="shortlist-remove"
                    onClick={() => toggleShortlist(entry)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              Nothing shortlisted yet. Open a Decision Brief and press
              &ldquo;Add to shortlist&rdquo; to keep a city here.
            </p>
          )}
          <button
            type="button"
            className="ghost-button full"
            onClick={() => setView('Brief')}
          >
            Open the brief for {city.name}
          </button>
        </PanelCard>

        <PanelCard
          eyebrow="MOVE BUDGET"
          title="What the move itself costs"
          icon={Wallet}
          className="budget-card"
          action={
            <span className="budget-total">
              {money(Math.round(budget.total))}
            </span>
          }
        >
          <div className="budget-lines">
            {budget.lines.map((line) => (
              <div key={line.id}>
                <span>
                  <strong>{line.label}</strong>
                  <small>{line.note}</small>
                </span>
                <div className="budget-input">
                  <i>$</i>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={Math.round(line.amount)}
                    aria-label={`${line.label} amount`}
                    onChange={(event) =>
                      setBudgetOverride(
                        city.id,
                        line.id,
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="budget-note">
            <CircleDollarSign size={14} aria-hidden="true" />
            {budget.monthsOfBuffer !== null
              ? ` That is ${budget.monthsOfBuffer.toFixed(1)} months of your gross income. Every figure is editable — overwrite it with a real quote as you get one.`
              : ' Every figure is editable — overwrite it with a real quote as you get one.'}
          </p>
        </PanelCard>
      </div>

      <PanelCard
        eyebrow="90-DAY TIMELINE"
        title="What to do, and when"
        icon={CalendarDays}
        className="timeline-card"
      >
        <div className="phase-grid">
          {movePhases.map((phase) => {
            const phaseTasks = tasks.filter(
              (task) => task.phase === (phase.key as MoveTaskPhase),
            )
            const phaseDone = phaseTasks.filter((task) =>
              completed.includes(task.id),
            ).length
            return (
              <div key={phase.key} className="phase-column">
                <div className="phase-head">
                  <span>
                    <strong>{phase.label}</strong>
                    <small>{phase.window}</small>
                  </span>
                  <b>
                    {phaseDone}/{phaseTasks.length}
                  </b>
                </div>
                <div className="phase-tasks">
                  {phaseTasks.map((task) => {
                    const done = completed.includes(task.id)
                    return (
                      <label
                        key={task.id}
                        className={`phase-task ${done ? 'complete' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleMoveTask(city.id, task.id)}
                        />
                        <span>
                          <strong>{task.label}</strong>
                          <small>{task.detail}</small>
                          <em
                            className={`task-tag tag-${categoryTone[task.category]}`}
                          >
                            {task.category}
                          </em>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </PanelCard>
    </div>
  )
}

export default MovePlanPage
