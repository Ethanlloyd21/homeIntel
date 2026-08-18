import { Bell, Download, Menu, Moon, Sun } from 'lucide-react'
import { Switch } from 'radix-ui'

const Header = ({
  onMenu,
  theme,
  onThemeChange,
}: {
  onMenu: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
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
        <p className="eyebrow">LOCATION INTELLIGENCE</p>
        <h1>Good morning, Lloyd.</h1>
      </div>
      <div className="header-actions">
        <div className="theme-control transition-all duration-200 hover:border-violet-400/60 hover:shadow-[0_0_18px_rgba(139,92,246,0.16)]">
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
        <button
          className="icon-btn transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <i />
        </button>
        <button className="export transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <Download size={16} /> Export report
        </button>
      </div>
    </header>
  )
}

export default Header
