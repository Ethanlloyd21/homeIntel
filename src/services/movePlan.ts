import type { LifeInputs } from 'services/lifeSimulator'

export type MoveTaskPhase = 'now' | 'day30' | 'day60' | 'day90'

export type MoveTask = {
  id: string
  phase: MoveTaskPhase
  label: string
  detail: string
  category: 'Money' | 'Housing' | 'Logistics' | 'Admin' | 'Family' | 'Work'
}

export type MoveBudgetLine = {
  id: string
  label: string
  amount: number
  note: string
  /** True when HomeIntel derived the figure rather than the user entering it. */
  derived: boolean
}

export type MoveBudget = {
  lines: MoveBudgetLine[]
  total: number
  monthsOfBuffer: number | null
}

export const movePhases: {
  key: MoveTaskPhase
  label: string
  window: string
}[] = [
  { key: 'now', label: 'Before you commit', window: 'This week' },
  { key: 'day30', label: 'First 30 days', window: 'Days 1–30' },
  { key: 'day60', label: 'Days 30–60', window: 'Days 31–60' },
  { key: 'day90', label: 'Days 60–90', window: 'Days 61–90' },
]

export const buildMoveTasks = (
  inputs: LifeInputs,
  cityName: string,
): MoveTask[] => {
  const hasKids = inputs.householdSize > 2 || inputs.childcareMonthly > 0
  const buying = inputs.housingMode === 'buy'

  const tasks: MoveTask[] = [
    {
      id: 'verify-income',
      phase: 'now',
      label: 'Get the offer or income in writing',
      detail:
        'Every number in your simulation rests on this one. Do not sign a lease or contract before it is confirmed.',
      category: 'Work',
    },
    {
      id: 'insurance-quote',
      phase: 'now',
      label: 'Request address-level insurance quotes',
      detail: `Hazard pricing in ${cityName} varies street by street. Get bindable quotes, not estimates.`,
      category: 'Money',
    },
    {
      id: 'tax-check',
      phase: 'now',
      label: 'Verify your real tax position',
      detail:
        'Replace the effective-rate assumption in the simulator with a figure from a tax professional or a payroll calculator for the new state.',
      category: 'Money',
    },
    {
      id: 'test-drive',
      phase: 'now',
      label: 'Run the test-drive visit',
      detail:
        'Drive the commute at peak, in the hard season. Three days minimum.',
      category: 'Logistics',
    },
    {
      id: 'reserve',
      phase: 'now',
      label: 'Build the move reserve',
      detail:
        'Deposits, movers, travel, and a month of double housing costs while leases overlap.',
      category: 'Money',
    },
    {
      id: buying ? 'mortgage-preapproval' : 'lease-shortlist',
      phase: 'day30',
      label: buying
        ? 'Get a mortgage pre-approval at the real rate'
        : 'Shortlist and apply for rentals',
      detail: buying
        ? 'The rate in your simulation is an assumption. A lock changes the monthly number materially.'
        : 'Most competitive markets need applications ready before a unit is listed.',
      category: 'Housing',
    },
    {
      id: 'movers',
      phase: 'day30',
      label: 'Collect three moving quotes',
      detail:
        'Binding, not-to-exceed quotes. Confirm the carrier is licensed for interstate moves.',
      category: 'Logistics',
    },
    ...(hasKids
      ? [
          {
            id: 'schools',
            phase: 'day30' as MoveTaskPhase,
            label: 'Confirm school attendance zone and enrolment',
            detail:
              'Zones follow district boundaries, not city limits. Confirm for the exact address, and ask about waitlists.',
            category: 'Family' as const,
          },
          {
            id: 'childcare',
            phase: 'day30' as MoveTaskPhase,
            label: 'Join childcare waitlists',
            detail:
              'Waitlists in high-growth metros routinely run past six months.',
            category: 'Family' as const,
          },
        ]
      : []),
    {
      id: 'healthcare',
      phase: 'day60',
      label: 'Transfer healthcare and prescriptions',
      detail:
        'Confirm your plan has an in-network primary care option nearby before you cancel the old one.',
      category: 'Family',
    },
    {
      id: 'utilities',
      phase: 'day60',
      label: 'Schedule utility start and stop dates',
      detail:
        'Power, water, internet. Book internet installation first — it has the longest lead time.',
      category: 'Admin',
    },
    {
      id: 'address',
      phase: 'day60',
      label: 'File the change of address',
      detail:
        'USPS forwarding, bank, employer payroll, and anything that mails a tax document.',
      category: 'Admin',
    },
    {
      id: 'license',
      phase: 'day90',
      label: 'Transfer driver licence and vehicle registration',
      detail:
        'Most states set a 30-to-90-day deadline after establishing residency, and insurance rates change with it.',
      category: 'Admin',
    },
    {
      id: 'voter',
      phase: 'day90',
      label: 'Register to vote and update state tax withholding',
      detail: 'Withholding follows residency, not your employer address.',
      category: 'Admin',
    },
    {
      id: 'recheck',
      phase: 'day90',
      label: 'Re-run the simulator against real bills',
      detail:
        'Replace every estimate with your first three actual statements, and see whether the plan held.',
      category: 'Money',
    },
  ]

  return tasks
}

export const buildMoveBudget = (
  inputs: LifeInputs,
  monthlyHousing: number,
  distanceMiles: number | null,
  overrides: Record<string, number> = {},
): MoveBudget => {
  const household = Math.max(1, Math.round(inputs.householdSize))
  const miles = distanceMiles ?? 600
  // Long-distance moving quotes scale with weight and distance; household size
  // is the best proxy for weight the app actually knows.
  const movers = 1_100 + household * 650 + miles * 1.35
  const deposit =
    inputs.housingMode === 'buy' ? 0 : Math.round(monthlyHousing * 2)
  const closing =
    inputs.housingMode === 'buy'
      ? Math.round((monthlyHousing * 12) / 0.06 > 0 ? monthlyHousing * 9 : 0)
      : 0
  const travel = Math.round(miles * 0.7 + household * 180)
  const overlap = Math.round(monthlyHousing)
  const setup = Math.round(600 + household * 220)

  const base: MoveBudgetLine[] = [
    {
      id: 'movers',
      label: 'Movers or truck rental',
      amount: Math.round(movers),
      note: `Scaled to a household of ${household} over ${Math.round(miles).toLocaleString()} miles.`,
      derived: true,
    },
    ...(deposit
      ? [
          {
            id: 'deposit',
            label: 'Deposit and first month',
            amount: deposit,
            note: 'Two months of the modeled rent, the common requirement.',
            derived: true,
          },
        ]
      : []),
    ...(closing
      ? [
          {
            id: 'closing',
            label: 'Closing costs and prepaids',
            amount: closing,
            note: 'Planning allowance only. Get a real loan estimate.',
            derived: true,
          },
        ]
      : []),
    {
      id: 'travel',
      label: 'Travel and the research trip',
      amount: travel,
      note: 'Fuel or flights, lodging, and meals while you visit and move.',
      derived: true,
    },
    {
      id: 'overlap',
      label: 'One month of overlapping housing',
      amount: overlap,
      note: 'Leases rarely line up. Budget for one month of both.',
      derived: true,
    },
    {
      id: 'setup',
      label: 'Setup costs',
      amount: setup,
      note: 'Utility deposits, internet install, and the things that never come with you.',
      derived: true,
    },
  ]

  const lines = base.map((line) =>
    line.id in overrides
      ? {
          ...line,
          amount: Math.max(0, overrides[line.id]),
          derived: false,
          note: 'Your figure.',
        }
      : line,
  )
  const total = lines.reduce((sum, line) => sum + line.amount, 0)
  const monthlyIncome = inputs.annualIncome / 12

  return {
    lines,
    total,
    monthsOfBuffer: monthlyIncome > 0 ? total / monthlyIncome : null,
  }
}
