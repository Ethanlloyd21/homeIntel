import { ArrowUp } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useAppStore } from 'store/useAppStore'

const resetScroll = () =>
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

const ScrollToTop = () => {
  const view = useAppStore((state) => state.view)
  const city = useAppStore((state) => state.city)
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    resetScroll()
  }, [view, city])

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const updateVisibility = () => setVisible(window.scrollY > 300)
    const onNavigation = () => {
      resetScroll()
      updateVisibility()
    }
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('popstate', onNavigation)
    window.addEventListener('pageshow', onNavigation)
    return () => {
      window.history.scrollRestoration = previousRestoration
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('popstate', onNavigation)
      window.removeEventListener('pageshow', onNavigation)
    }
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      title="Back to top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
        })
      }
    >
      <ArrowUp size={22} aria-hidden="true" />
    </button>
  )
}

export default ScrollToTop
