import { create } from 'zustand'
import type { City } from '../data/cities'

type AppState = {
  view: string
  city: City | null
  comparisonCity: City | null
  mobileNavOpen: boolean
  setView: (view: string) => void
  selectCity: (city: City) => void
  setComparisonCity: (city: City) => void
  setMobileNavOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'Overview',
  city: null,
  comparisonCity: null,
  mobileNavOpen: false,
  setView: (view) => set({ view }),
  selectCity: (city) =>
    set((state) => ({
      city,
      comparisonCity: state.comparisonCity ?? city,
    })),
  setComparisonCity: (comparisonCity) => set({ comparisonCity }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}))
