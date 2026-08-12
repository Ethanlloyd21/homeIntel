import { create } from 'zustand'
import type { City } from '../data/cities'

type AppState = {
  view: string
  city: City | null
  comparisonCity: City | null
  mobileNavOpen: boolean
  theme: 'light' | 'dark'
  setView: (view: string) => void
  selectCity: (city: City) => void
  setComparisonCity: (city: City) => void
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
  Compare: '/compare-cities',
}

export function viewFromPath(pathname: string) {
  const entry = Object.entries(viewPaths).find(([, path]) => path === pathname)
  return entry?.[0] ?? 'Overview'
}

function updatePath(view: string) {
  const path = viewPaths[view] ?? '/overview'
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
}

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
  city: null,
  comparisonCity: null,
  mobileNavOpen: false,
  theme: initialTheme,
  setView: (view) => {
    updatePath(view)
    set({ view })
  },
  selectCity: (city) =>
    set((state) => {
      updatePath(state.view)
      return { city }
    }),
  setComparisonCity: (comparisonCity) => set({ comparisonCity }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setTheme: (theme) => {
    localStorage.setItem('homeintel-theme', theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
}))
