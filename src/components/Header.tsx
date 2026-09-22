import { Coffee, Menu, Moon, Search, Sun } from 'lucide-react'
import { Switch } from 'radix-ui'
import Brand from 'components/Brand'
import { greeting } from 'utils/greeting'

const Header = ({
  onMenu,
  theme,
  onThemeChange,
  onOpenPalette,
  variant = 'app',
  menuOpen = false,
}: {
  onMenu: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onOpenPalette: () => void
  /**
   * The landing page has no sidebar to carry the wordmark and no city to greet
   * the user about, so it flies the brand in the bar instead of the greeting.
   */
  variant?: 'app' | 'landing'
  menuOpen?: boolean
}) => {
  const landing = variant === 'landing'
  const coffeeUrl =
    import.meta.env.VITE_KOFI_URL?.trim() || 'https://ko-fi.com/relointel'
  const hasCoffeeAccount = /^https:\/\/ko-fi\.com\/[a-z0-9_-]+\/?$/i.test(
    coffeeUrl,
  )

  return (
    <header className={landing ? 'header-landing' : undefined}>
      {landing ? (
        <Brand />
      ) : (
        <>
          <button
            className="menu rounded-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            onClick={onMenu}
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            <Menu />
          </button>
          <div className="header-greeting">
            <p className="eyebrow">RELOCATION INTELLIGENCE</p>
            <h1>{greeting()}. Where are you thinking of moving?</h1>
          </div>
        </>
      )}
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
        {hasCoffeeAccount && (
          <a
            className="coffee-support"
            href={coffeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee on Ko-fi (opens in a new tab)"
            title="Support ReloIntel on Ko-fi (opens in a new tab)"
          >
            <Coffee size={19} aria-hidden="true" />
            <span>Buy me a coffee</span>
          </a>
        )}
      </div>
    </header>
  )
}

export default Header
