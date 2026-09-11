import { create } from 'zustand'
import type { City } from 'data/cities'

type AppState = {
  view: string
  city: City | null
  comparisonCity: City | null
  mobileNavOpen: boolean
  theme: 'light' | 'dark'
  setView: (view: string) => void
  selectCity: (city: City) => void
  setComparisonCity: (city: City | null) => void
  clearCity: () => void
  /** Clears both selected cities and returns to the landing search. */
  resetSelection: () => void
  setMobileNavOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

const viewPaths: Record<string, string> = {
  Overview: '/overview',
  Housing: '/housing',
  People: '/people',
  Employment: '/employment',
  Risk: '/risk',
  Environment: '/environment',
  Neighborhoods: '/neighborhoods',
  Simulator: '/life-simulator',
  DayInLife: '/day-in-the-life',
  Brief: '/decision-brief',
  MovePlan: '/move-plan',
  Compare: '/compare-cities',
}

export const viewFromPath = (pathname: string) => {
  const entry = Object.entries(viewPaths).find(([, path]) => path === pathname)
  return entry?.[0] ?? 'Overview'
}

const updatePath = (view: string) => {
  const path = viewPaths[view] ?? '/overview'
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
}

/**
 * The selected cities survive a reload so that a deep link such as
 * /decision-brief opens the brief instead of bouncing back to the landing
 * search.
 */
const citiesKey = 'homeintel-selected-cities'

const loadSelectedCities = () => {
  try {
    const saved = localStorage.getItem(citiesKey)
    if (!saved) return { city: null, comparisonCity: null }
    const parsed = JSON.parse(saved) as {
      city?: City | null
      comparisonCity?: City | null
    }
    return {
      city: parsed.city ?? null,
      comparisonCity: parsed.comparisonCity ?? null,
    }
  } catch {
    return { city: null, comparisonCity: null }
  }
}

const saveSelectedCities = (city: City | null, comparisonCity: City | null) => {
  try {
    localStorage.setItem(citiesKey, JSON.stringify({ city, comparisonCity }))
  } catch {
    // A full or blocked storage quota must not break navigation.
  }
}

const savedCities = loadSelectedCities()

const savedTheme = localStorage.getItem('homeintel-theme')
const initialTheme =
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

document.documentElement.dataset.theme = initialTheme
document.documentElement.style.colorScheme = initialTheme

export const useAppStore = create<AppState>((set) => ({
  view: viewFromPath(window.location.pathname),
  city: savedCities.city,
  comparisonCity: savedCities.comparisonCity,
  mobileNavOpen: false,
  theme: initialTheme,
  setView: (view) => {
    updatePath(view)
    set({ view })
  },
  selectCity: (city) =>
    set((state) => {
      updatePath(state.view)
      saveSelectedCities(city, state.comparisonCity)
      return { city }
    }),
  setComparisonCity: (comparisonCity) =>
    set((state) => {
      saveSelectedCities(state.city, comparisonCity)
      return { comparisonCity }
    }),
  clearCity: () =>
    set((state) => {
      saveSelectedCities(null, state.comparisonCity)
      window.history.pushState({}, '', '/')
      return { city: null }
    }),
  resetSelection: () => {
    saveSelectedCities(null, null)
    window.history.pushState({}, '', '/')
    set({
      city: null,
      comparisonCity: null,
      view: 'Overview',
      mobileNavOpen: false,
    })
  },
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setTheme: (theme) => {
    localStorage.setItem('homeintel-theme', theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
}))
