import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { City } from 'data/cities'
import {
  defaultDealBreakers,
  defaultLifeInputs,
  defaultPreferenceWeights,
  type DealBreakers,
  type LifeInputs,
  type PreferenceWeights,
} from 'services/lifeSimulator'

export type GeoPoint = {
  label: string
  latitude: number
  longitude: number
}

export type CityAnchors = {
  home: GeoPoint | null
  work: GeoPoint | null
}

export const defaultPartnerWeights: PreferenceWeights = {
  affordability: 3,
  career: 2,
  safety: 5,
  community: 4,
}

type ProfileState = {
  inputs: LifeInputs
  dealBreakers: DealBreakers
  weights: PreferenceWeights
  partnerWeights: PreferenceWeights
  partnerEnabled: boolean
  /** The city the household lives in today. Every "shock" metric compares to it. */
  originCity: City | null
  shortlist: City[]
  anchors: Record<string, CityAnchors>
  readiness: Record<string, string[]>
  moveTasks: Record<string, string[]>
  budgetOverrides: Record<string, Record<string, number>>

  setInput: <K extends keyof LifeInputs>(key: K, value: LifeInputs[K]) => void
  setInputs: (inputs: Partial<LifeInputs>) => void
  setRule: <K extends keyof DealBreakers>(
    key: K,
    value: DealBreakers[K],
  ) => void
  setWeights: (weights: PreferenceWeights) => void
  setPartnerWeights: (weights: PreferenceWeights) => void
  setPartnerEnabled: (enabled: boolean) => void
  setOriginCity: (city: City | null) => void
  toggleShortlist: (city: City) => void
  isShortlisted: (cityId: string) => boolean
  setAnchor: (
    cityId: string,
    key: keyof CityAnchors,
    point: GeoPoint | null,
  ) => void
  toggleReadiness: (cityId: string, item: string) => void
  toggleMoveTask: (cityId: string, taskId: string) => void
  setBudgetOverride: (
    cityId: string,
    lineId: string,
    amount: number | null,
  ) => void
  resetProfile: () => void
}

/** Values written by the pre-store version of the Life Simulator page. */
const legacy = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? ({ ...fallback, ...JSON.parse(saved) } as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * The pre-store build had no `currentAnnualIncome`, so a migrated profile would
 * compare its saved income against the 90k default and report an imaginary pay
 * rise. Start that comparison neutral.
 */
const legacyInputs = (): LifeInputs => {
  const inputs = legacy('homeintel-life-inputs', defaultLifeInputs)
  const saved = localStorage.getItem('homeintel-life-inputs')
  if (saved && !saved.includes('currentAnnualIncome')) {
    return { ...inputs, currentAnnualIncome: inputs.annualIncome }
  }
  return inputs
}

const initialState = {
  inputs: legacyInputs(),
  dealBreakers: legacy('homeintel-deal-breakers', defaultDealBreakers),
  weights: legacy('homeintel-first-preferences', defaultPreferenceWeights),
  partnerWeights: legacy('homeintel-second-preferences', defaultPartnerWeights),
  partnerEnabled: false,
  originCity: null as City | null,
  shortlist: [] as City[],
  anchors: {} as Record<string, CityAnchors>,
  readiness: legacy<Record<string, string[]>>('homeintel-readiness', {}),
  moveTasks: {} as Record<string, string[]>,
  budgetOverrides: {} as Record<string, Record<string, number>>,
}

const toggleIn = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value]

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setInput: (key, value) =>
        set((state) => ({ inputs: { ...state.inputs, [key]: value } })),
      setInputs: (inputs) =>
        set((state) => ({ inputs: { ...state.inputs, ...inputs } })),
      setRule: (key, value) =>
        set((state) => ({
          dealBreakers: { ...state.dealBreakers, [key]: value },
        })),
      setWeights: (weights) => set({ weights }),
      setPartnerWeights: (partnerWeights) => set({ partnerWeights }),
      setPartnerEnabled: (partnerEnabled) => set({ partnerEnabled }),
      setOriginCity: (originCity) => set({ originCity }),

      toggleShortlist: (city) =>
        set((state) => ({
          shortlist: state.shortlist.some((entry) => entry.id === city.id)
            ? state.shortlist.filter((entry) => entry.id !== city.id)
            : [...state.shortlist, city],
        })),
      isShortlisted: (cityId) =>
        get().shortlist.some((entry) => entry.id === cityId),

      setAnchor: (cityId, key, point) =>
        set((state) => ({
          anchors: {
            ...state.anchors,
            [cityId]: {
              ...{ home: null, work: null },
              ...state.anchors[cityId],
              [key]: point,
            },
          },
        })),

      toggleReadiness: (cityId, item) =>
        set((state) => ({
          readiness: {
            ...state.readiness,
            [cityId]: toggleIn(state.readiness[cityId] ?? [], item),
          },
        })),

      toggleMoveTask: (cityId, taskId) =>
        set((state) => ({
          moveTasks: {
            ...state.moveTasks,
            [cityId]: toggleIn(state.moveTasks[cityId] ?? [], taskId),
          },
        })),

      setBudgetOverride: (cityId, lineId, amount) =>
        set((state) => {
          const existing = { ...(state.budgetOverrides[cityId] ?? {}) }
          if (amount === null) delete existing[lineId]
          else existing[lineId] = amount
          return {
            budgetOverrides: { ...state.budgetOverrides, [cityId]: existing },
          }
        }),

      resetProfile: () =>
        set({
          inputs: defaultLifeInputs,
          dealBreakers: defaultDealBreakers,
          weights: defaultPreferenceWeights,
          partnerWeights: defaultPartnerWeights,
          partnerEnabled: false,
        }),
    }),
    {
      name: 'homeintel-profile',
      version: 1,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ProfileState>
        const inputs = {
          ...defaultLifeInputs,
          ...current.inputs,
          ...saved.inputs,
        }
        // A profile saved before `currentAnnualIncome` existed would otherwise
        // compare the saved income against the 90k default and report a huge
        // imaginary pay rise. Start the comparison neutral instead.
        if (saved.inputs && saved.inputs.currentAnnualIncome === undefined) {
          inputs.currentAnnualIncome = inputs.annualIncome
        }
        return {
          ...current,
          ...saved,
          // New fields must survive a profile saved by an older build.
          inputs,
          dealBreakers: {
            ...defaultDealBreakers,
            ...current.dealBreakers,
            ...saved.dealBreakers,
          },
          weights: { ...defaultPreferenceWeights, ...saved.weights },
          partnerWeights: {
            ...defaultPartnerWeights,
            ...saved.partnerWeights,
          },
        }
      },
    },
  ),
)
