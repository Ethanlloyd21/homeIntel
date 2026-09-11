import { Menu, Moon, Search, Sun } from 'lucide-react'
import { Switch } from 'radix-ui'

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const Header = ({
  onMenu,
  theme,
  onThemeChange,
  onOpenPalette,
}: {
  onMenu: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onOpenPalette: () => void
}) => {
  return (
    <header>
      <button
        className="menu rounded-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      <div>
        <p className="eyebrow">RELOCATION INTELLIGENCE</p>
        <h1>{greeting()}. Where are you thinking of moving?</h1>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="palette-trigger"
          onClick={onOpenPalette}
          aria-label="Open command palette"
        >
          <Search size={15} aria-hidden="true" />
          <span>Search or jump to…</span>
          <kbd>
            {typeof navigator !== 'undefined' &&
            navigator.platform.toLowerCase().includes('mac')
              ? '⌘'
              : 'Ctrl'}
            K
          </kbd>
        </button>
        <div className="theme-control">
          <Sun size={15} aria-hidden="true" />
          <Switch.Root
            className="theme-switch outline-none transition focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            checked={theme === 'dark'}
            onCheckedChange={(checked) =>
              onThemeChange(checked ? 'dark' : 'light')
            }
            aria-label="Use dark mode"
          >
            <Switch.Thumb className="theme-switch-thumb" />
          </Switch.Root>
          <Moon size={15} aria-hidden="true" />
        </div>
      </div>
    </header>
  )
}

export default Header
