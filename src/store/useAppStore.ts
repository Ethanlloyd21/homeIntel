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
  view: 'Overview',
  city: null,
  comparisonCity: null,
  mobileNavOpen: false,
  theme: initialTheme,
  setView: (view) => set({ view }),
  selectCity: (city) =>
    set((state) => ({
      city,
      comparisonCity: state.comparisonCity ?? city,
    })),
  setComparisonCity: (comparisonCity) => set({ comparisonCity }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setTheme: (theme) => {
    localStorage.setItem('homeintel-theme', theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
}))
