export type StateMinimumWage = {
  rateLabel: string
  note?: string
}

export const MINIMUM_WAGE_EFFECTIVE_DATE = 'July 1, 2026'
export const MINIMUM_WAGE_SOURCE =
  'https://www.dol.gov/agencies/whd/minimum-wage/state'

const federalFloorNote =
  'Federal minimum for workers covered by the FLSA; state law is lower or has no minimum.'

export const stateMinimumWages: Record<string, StateMinimumWage> = {
  AL: { rateLabel: '$7.25', note: federalFloorNote },
  AK: { rateLabel: '$14.00' },
  AZ: { rateLabel: '$15.15' },
  AR: {
    rateLabel: '$11.00',
    note: 'Applies to employers with 4 or more employees.',
  },
  CA: { rateLabel: '$16.90' },
  CO: { rateLabel: '$15.16' },
  CT: { rateLabel: '$16.94' },
  DC: { rateLabel: '$18.40' },
  DE: { rateLabel: '$15.00' },
  FL: { rateLabel: '$14.00' },
  GA: { rateLabel: '$7.25', note: federalFloorNote },
  HI: { rateLabel: '$16.00' },
  ID: { rateLabel: '$7.25' },
  IL: {
    rateLabel: '$15.00',
    note: 'Applies to employers with 4 or more employees.',
  },
  IN: { rateLabel: '$7.25' },
  IA: { rateLabel: '$7.25' },
  KS: { rateLabel: '$7.25' },
  KY: { rateLabel: '$7.25' },
  LA: { rateLabel: '$7.25', note: federalFloorNote },
  MA: { rateLabel: '$15.00' },
  MD: { rateLabel: '$15.00' },
  ME: { rateLabel: '$15.10' },
  MI: { rateLabel: '$13.73' },
  MN: { rateLabel: '$11.41' },
  MO: { rateLabel: '$15.00' },
  MS: { rateLabel: '$7.25', note: federalFloorNote },
  MT: {
    rateLabel: '$10.85',
    note: 'A lower rate can apply to certain small businesses not covered by the FLSA.',
  },
  NC: { rateLabel: '$7.25' },
  ND: { rateLabel: '$7.25' },
  NE: {
    rateLabel: '$15.00',
    note: 'Applies to employers with 4 or more employees.',
  },
  NH: { rateLabel: '$7.25' },
  NJ: {
    rateLabel: '$15.92',
    note: '$15.23 for small and seasonal employers.',
  },
  NM: { rateLabel: '$12.00' },
  NV: { rateLabel: '$12.00' },
  NY: {
    rateLabel: '$16.00–$17.00',
    note: '$17.00 in New York City, Nassau, Suffolk, and Westchester; $16.00 elsewhere.',
  },
  OH: {
    rateLabel: '$7.25–$11.00',
    note: 'Rate depends on employer annual gross receipts.',
  },
  OK: { rateLabel: '$7.25', note: federalFloorNote },
  OR: {
    rateLabel: '$14.55–$16.80',
    note: '$16.80 Portland metro, $15.55 standard, and $14.55 in non-urban counties.',
  },
  PA: { rateLabel: '$7.25' },
  RI: { rateLabel: '$16.00' },
  SC: { rateLabel: '$7.25', note: federalFloorNote },
  SD: { rateLabel: '$11.85' },
  TN: { rateLabel: '$7.25', note: federalFloorNote },
  TX: { rateLabel: '$7.25' },
  UT: { rateLabel: '$7.25' },
  VA: { rateLabel: '$12.77' },
  VT: {
    rateLabel: '$14.42',
    note: 'Applies to employers with 2 or more employees.',
  },
  WA: { rateLabel: '$17.13' },
  WI: { rateLabel: '$7.25' },
  WV: {
    rateLabel: '$8.75',
    note: 'Applies to employers with 6 or more employees at one location.',
  },
  WY: { rateLabel: '$7.25', note: federalFloorNote },
}
