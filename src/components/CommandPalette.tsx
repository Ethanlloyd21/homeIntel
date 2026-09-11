import {
  Building2,
  Calculator,
  CloudSun,
  Command,
  Compass,
  FileText,
  Home,
  MapPinned,
  Moon,
  Route,
  Search,
  ShieldAlert,
  Sun,
  Users,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { cityFromGeocoding, type City } from 'data/cities'
import { useLocationSearchQuery } from 'hooks/useLocationSearchQuery'

type Command = {
  id: string
  label: string
  hint: string
  icon: LucideIcon
  run: () => void
}

const viewCommands: {
  view: string
  label: string
  hint: string
  icon: LucideIcon
}[] = [
  { view: 'Overview', label: 'Overview', hint: 'City snapshot', icon: Compass },
  {
    view: 'Housing',
    label: 'Housing',
    hint: 'Values, rent, ownership',
    icon: Home,
  },
  { view: 'People', label: 'People', hint: 'Demographics', icon: Users },
  {
    view: 'Employment',
    label: 'Employment',
    hint: 'Jobs and employers',
    icon: Building2,
  },
  { view: 'Risk', label: 'Risk', hint: 'FEMA hazards', icon: ShieldAlert },
  {
    view: 'Environment',
    label: 'Environment',
    hint: 'Weather and climate',
    icon: CloudSun,
  },
  {
    view: 'Neighborhoods',
    label: 'Neighbourhoods',
    hint: 'Pin a home and workplace',
    icon: MapPinned,
  },
  {
    view: 'Simulator',
    label: 'Life simulator',
    hint: 'Your monthly budget here',
    icon: Calculator,
  },
  {
    view: 'DayInLife',
    label: 'Day in your life',
    hint: 'Weather, commute, routine',
    icon: Sun,
  },
  {
    view: 'Brief',
    label: 'Decision brief',
    hint: 'Verdict and regret check',
    icon: FileText,
  },
  {
    view: 'MovePlan',
    label: 'Move plan',
    hint: 'Budget and 90-day timeline',
    icon: Route,
  },
  {
    view: 'Compare',
    label: 'Compare cities',
    hint: 'Side by side',
    icon: BarChart3,
  },
]

/** Mounted only while open, so opening always starts from a clean query. */
const CommandPalette = ({
  onClose,
  setView,
  selectCity,
  theme,
  onThemeChange,
}: {
  onClose: () => void
  setView: (view: string) => void
  selectCity: (city: City) => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}) => {
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const deferred = useDeferredValue(query.trim())
  const locations = useLocationSearchQuery(deferred)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const term = query.trim().toLowerCase()

  // App actions are ranked above city results. Otherwise a term that matches a
  // real command also matches some small town somewhere — typing "light" and
  // pressing Enter would research Light, Arkansas instead of switching theme.
  const actions: Command[] = [
    ...viewCommands.map((entry) => ({
      id: `view-${entry.view}`,
      label: entry.label,
      hint: entry.hint,
      icon: entry.icon,
      run: () => {
        setView(entry.view)
        onClose()
      },
    })),
    {
      id: 'theme',
      label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      hint: 'Appearance',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => {
        onThemeChange(theme === 'dark' ? 'light' : 'dark')
        onClose()
      },
    },
  ]

  const commands: Command[] = [
    ...actions.filter(
      (action) =>
        !term ||
        action.label.toLowerCase().includes(term) ||
        action.hint.toLowerCase().includes(term),
    ),
    ...(term.length >= 2
      ? (locations.data ?? []).map((result) => ({
          id: `city-${result.id}`,
          label: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`,
          hint: `Research this city · ${result.country ?? ''}`.trim(),
          icon: Search,
          run: () => {
            selectCity(cityFromGeocoding(result))
            setView('Overview')
            onClose()
          },
        }))
      : []),
  ]

  const active = Math.min(highlight, Math.max(0, commands.length - 1))

  return (
    <div
      className="palette-scrim"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="palette-input">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            placeholder="Jump to a page, or search any city…"
            aria-label="Search commands and cities"
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlight(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setHighlight((current) => (current + 1) % commands.length)
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setHighlight(
                  (current) =>
                    (current - 1 + commands.length) % commands.length,
                )
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                commands[active]?.run()
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-results">
          {commands.length ? (
            commands.map((command, index) => (
              <button
                key={command.id}
                type="button"
                className={index === active ? 'active' : ''}
                onMouseEnter={() => setHighlight(index)}
                onClick={command.run}
              >
                <command.icon size={16} aria-hidden="true" />
                <span>
                  {command.label}
                  <small>{command.hint}</small>
                </span>
              </button>
            ))
          ) : (
            <p>No matches.</p>
          )}
        </div>
        <footer className="palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
        </footer>
      </div>
    </div>
  )
}

export default CommandPalette
