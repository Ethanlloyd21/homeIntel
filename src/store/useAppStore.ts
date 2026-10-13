import { create } from 'zustand'
import { cityFromGeocoding, type City } from 'data/cities'
import { cityFromSearch, viewFromPath, workspacePath } from 'utils/routes'

export { viewFromPath } from 'utils/routes'

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
  syncLocation: () => void
}

const updatePath = (view: string, city: City | null) => {
  const path = workspacePath(view, city)
  if (`${window.location.pathname}${window.location.search}` !== path)
    window.history.pushState({}, '', path)
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
const linkedCity = cityFromSearch(window.location.search)
const initialCity = linkedCity
  ? cityFromGeocoding(linkedCity)
  : savedCities.city
if (linkedCity) saveSelectedCities(initialCity, savedCities.comparisonCity)

const savedTheme = localStorage.getItem('homeintel-theme')
const initialTheme =
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

document.documentElement.dataset.theme = initialTheme
document.documentElement.style.colorScheme = initialTheme

export const useAppStore = create<AppState>((set, get) => ({
  view: viewFromPath(window.location.pathname),
  city: initialCity,
  comparisonCity: savedCities.comparisonCity,
  mobileNavOpen: false,
  theme: initialTheme,
  setView: (view) => {
    updatePath(view, get().city)
    set({ view })
  },
  selectCity: (city) =>
    set((state) => {
      updatePath(state.view, city)
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
  syncLocation: () => {
    const linked = cityFromSearch(window.location.search)
    const city =
      window.location.pathname === '/'
        ? null
        : linked
          ? cityFromGeocoding(linked)
          : get().city
    saveSelectedCities(city, get().comparisonCity)
    set({ view: viewFromPath(window.location.pathname), city })
  },
  setTheme: (theme) => {
    localStorage.setItem('homeintel-theme', theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
}))
