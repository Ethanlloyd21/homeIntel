import {
  ArrowDown,
  Building2,
  Calculator,
  CloudSun,
  FileText,
  Home,
  Layers3,
  MapPinned,
  Route,
  ShieldAlert,
  RotateCcw,
  Pencil,
  Sun,
  Users,
  Compass,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Brand from 'components/Brand'
import SearchBox from 'components/SearchBox'
import type { City } from 'data/cities'
import { useProfileStore } from 'store/useProfileStore'

const cityLabel = (city: City) =>
  [city.name, city.state].filter(Boolean).join(', ')

/**
 * One end of the move. The city is picked in place rather than by sending the
 * user to whichever page owns it: an origin that was already set had no editor
 * anywhere in the app, so it could only be cleared and re-entered.
 */
const MoveLeg = ({
  label,
  city,
  emptyLabel,
  placeholder,
  editing,
  onStartEdit,
  onStopEdit,
  onSelect,
  onClear,
}: {
  label: string
  city: City | null
  emptyLabel: string
  placeholder: string
  editing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  onSelect: (city: City) => void
  onClear: () => void
}) => {
  const lower = label.toLowerCase()

  return (
    <div className={`move-leg ${city ? 'set' : ''}`}>
      <small>{label}</small>
      {editing ? (
        <div
          className="move-leg-search"
          onKeyDown={(event) => {
            if (event.key === 'Escape') onStopEdit()
          }}
        >
          <SearchBox
            onSelect={(next) => {
              onSelect(next)
              onStopEdit()
            }}
            placeholder={placeholder}
            initialValue={city ? cityLabel(city) : ''}
            autoFocus
          />
          <button
            type="button"
            className="move-leg-clear"
            onClick={onStopEdit}
            aria-label={`Stop editing ${lower}`}
            title="Cancel"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="move-leg-value"
            onClick={onStartEdit}
            title={city ? `Change ${lower}` : `Set ${lower}`}
          >
            <span>{city ? cityLabel(city) : emptyLabel}</span>
            <Pencil size={11} aria-hidden="true" />
          </button>
          {city && (
            <button
              type="button"
              className="move-leg-clear"
              onClick={onClear}
              aria-label={`Clear ${lower}`}
              title={`Clear ${lower}`}
            >
              <X size={13} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

type NavItem = {
  view: string
  label: string
  icon: LucideIcon
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Research',
    items: [
      { view: 'Overview', label: 'Overview', icon: Compass },
      { view: 'Housing', label: 'Housing', icon: Home },
      { view: 'People', label: 'People', icon: Users },
      { view: 'Employment', label: 'Employment', icon: Building2 },
      { view: 'Risk', label: 'Risk', icon: ShieldAlert },
      { view: 'Environment', label: 'Environment', icon: CloudSun },
      { view: 'Neighborhoods', label: 'Neighbourhoods', icon: MapPinned },
    ],
  },
  {
    title: 'Decide',
    items: [
      { view: 'Simulator', label: 'Life simulator', icon: Calculator },
      { view: 'DayInLife', label: 'Day in your life', icon: Sun },
      { view: 'Brief', label: 'Decision brief', icon: FileText },
      { view: 'MovePlan', label: 'Move plan', icon: Route },
    ],
  },
]

const Sidebar = ({
  active,
  setActive,
  open,
  close,
  city,
  onReset,
  onClearDestination,
  onSelectDestination,
}: {
  active: string
  setActive: (view: string) => void
  open: boolean
  close: () => void
  city: City | null
  onReset: () => void
  onClearDestination: () => void
  onSelectDestination: (city: City) => void
}) => {
  const shortlistCount = useProfileStore((state) => state.shortlist.length)
  const originCity = useProfileStore((state) => state.originCity)
  const setOriginCity = useProfileStore((state) => state.setOriginCity)
  const [editingLeg, setEditingLeg] = useState<'origin' | 'destination' | null>(
    null,
  )
  const stopEditing = () => setEditingLeg(null)
  const drawer = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 820px)').matches) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const main = drawer.current?.parentElement?.querySelector('main')
    const previousInert = main?.inert ?? false
    document.body.style.overflow = 'hidden'
    if (main) main.inert = true
    drawer.current?.querySelector<HTMLButtonElement>('.mobile-close')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
      if (event.key !== 'Tab') return
      const items = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0)
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    const breakpoint = window.matchMedia('(max-width: 820px)')
    const onBreakpoint = () => close()
    breakpoint.addEventListener('change', onBreakpoint)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      if (main) main.inert = previousInert
      breakpoint.removeEventListener('change', onBreakpoint)
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus()
    }
  }, [open, close])

  return (
    <aside
      ref={drawer}
      id="primary-navigation"
      aria-label="Primary navigation"
      className={`sidebar ${open ? 'open' : ''}`}
    >
      <div className="sidebar-top">
        <Brand onReset={onReset} />
        <button
          className="mobile-close min-h-11 min-w-11 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          onClick={close}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>
      <nav>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p className="nav-group-title">{group.title}</p>
            {group.items.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                className={`${active === view ? 'active' : ''} min-h-11 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70`}
                onClick={() => {
                  setActive(view)
                  close()
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {view === 'MovePlan' && shortlistCount > 0 && (
                  <b className="nav-badge">{shortlistCount}</b>
                )}
                {active === view && <i />}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="source-card">
          <div>
            <Layers3 size={16} />
            <span>Verified sources</span>
          </div>
          <strong>9 connected</strong>
          <p>Census · FEMA · Zillow · BEA · BLS · NCES · HIFLD · Open-Meteo</p>
        </div>
        <div className="move-card">
          <div className="move-card-head">
            <small>Your move</small>
            {(originCity || city) && (
              <button
                type="button"
                className="move-card-reset"
                onClick={() => {
                  stopEditing()
                  onReset()
                }}
                title="Clear both cities and start over"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
          <MoveLeg
            label="Moving from"
            city={originCity}
            emptyLabel="Not set — tap to set"
            placeholder="Search your current city"
            editing={editingLeg === 'origin'}
            onStartEdit={() => setEditingLeg('origin')}
            onStopEdit={stopEditing}
            onSelect={setOriginCity}
            onClear={() => setOriginCity(null)}
          />
          <ArrowDown size={13} className="move-card-arrow" aria-hidden="true" />
          <MoveLeg
            label="Moving to"
            city={city}
            emptyLabel="No city selected"
            placeholder="Search the city you're researching"
            editing={editingLeg === 'destination'}
            onStartEdit={() => setEditingLeg('destination')}
            onStopEdit={stopEditing}
            onSelect={(next) => {
              onSelectDestination(next)
              close()
            }}
            onClear={onClearDestination}
          />
          <p>
            {originCity
              ? 'Every shock metric compares against the city you are moving from.'
              : 'Set where you live now to unlock the comparison metrics.'}
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
