import type { ClimateProfile } from 'services/climate'
import type {
  CityLifeData,
  DealBreakers,
  LifeInputs,
} from 'services/lifeSimulator'
import type { RegretAssessment } from 'services/regret'

export type TestDriveStop = {
  id: string
  time: string
  title: string
  purpose: string
  /** What to look for, phrased so you can answer yes or no on the ground. */
  check: string
  /** Which regret factor or deal-breaker this stop is meant to resolve. */
  resolves: string
}

export type TestDriveDay = {
  key: string
  label: string
  focus: string
  stops: TestDriveStop[]
}

export type TestDrivePlan = {
  cityName: string
  /** The season worth visiting in, and why. */
  whenToVisit: { window: string; reason: string }
  days: TestDriveDay[]
  packing: string[]
  budgetNote: string
}

export type TestDriveContext = {
  cityName: string
  destination: CityLifeData
  climate: ClimateProfile | null
  regret: RegretAssessment
  inputs: LifeInputs
  dealBreakers: DealBreakers
  nearestSchoolName: string | null
  nearestHospitalName: string | null
  topEmployers: string[]
}

/**
 * The most useful relocation visit happens in the city's least comfortable
 * season, not its best one. Pick that window from the observed record.
 */
const worstSeason = (climate: ClimateProfile | null) => {
  if (!climate?.seasons.length)
    return {
      window: 'The season locals warn you about',
      reason:
        'Historical weather has not loaded, so pick the season residents say is hardest.',
    }
  const hot = climate.hotDaysPerYear
  const cold = climate.freezingDaysPerYear
  if (hot >= cold && hot > 20) {
    return {
      window: `${climate.hottestMonth?.label ?? 'Mid-summer'}`,
      reason: `${hot} days a year reach 90°F, and ${climate.hottestMonth?.label ?? 'the hottest month'} averages a ${Math.round(climate.hottestMonth?.averageHigh ?? 0)}°F high. Visit then, not in spring.`,
    }
  }
  if (cold > 20) {
    return {
      window: `${climate.coldestMonth?.label ?? 'Mid-winter'}`,
      reason: `${cold} nights a year fall below freezing, and ${climate.coldestMonth?.label ?? 'the coldest month'} averages a ${Math.round(climate.coldestMonth?.averageLow ?? 0)}°F low. Visit then to feel the real winter.`,
    }
  }
  return {
    window: 'the wettest month',
    reason: `${climate.wetDaysPerYear} wet days a year. Temperature is mild year-round here, so rain is the thing to test.`,
  }
}

export const buildTestDrivePlan = (
  context: TestDriveContext,
): TestDrivePlan => {
  const { cityName, inputs, climate, regret } = context
  const hasKids = inputs.householdSize > 2 || inputs.childcareMonthly > 0
  const buying = inputs.housingMode === 'buy'
  const topRiskLabels = regret.topRisks.map((factor) => factor.label)
  const resolves = (label: string) =>
    topRiskLabels.includes(label) ? `${label} — your top regret risk` : label

  const days: TestDriveDay[] = [
    {
      key: 'day-1',
      label: 'Day 1 — The commute and the money',
      focus:
        'Test the two things that decide most moves: what the daily drive feels like, and what housing actually costs.',
      stops: [
        {
          id: 'rush-hour-out',
          time: '7:30 AM',
          title: 'Drive the real commute, outbound',
          purpose:
            'Start from a neighbourhood you could afford and drive to the workplace or district you would work in.',
          check:
            inputs.commuteMiles > 0
              ? `Did it take more than your ${Math.round(inputs.commuteMiles)}-mile assumption suggests? Time it with the clock, not the map app estimate.`
              : 'Time it with the clock, not the map app estimate, and put the real figure into the simulator.',
          resolves: resolves('Commute shock'),
        },
        {
          id: 'grocery',
          time: '9:30 AM',
          title: 'Walk a full grocery run',
          purpose:
            'Price a basket you actually buy — not an index — at the store nearest the housing you are considering.',
          check: `Compare the total against the grocery line in your simulator for a household of ${inputs.householdSize}.`,
          resolves: 'Cost of living',
        },
        {
          id: 'housing-tour',
          time: '11:00 AM',
          title: buying
            ? 'Tour three homes in budget'
            : 'Tour three rentals in budget',
          purpose: buying
            ? `See what ${`$${Math.round(context.destination.medianHomeValue).toLocaleString()}`} actually buys here, and ask each listing agent for the real tax bill and insurance quote.`
            : `See what ${`$${Math.round(context.destination.medianRent).toLocaleString()}`}/mo actually rents here, and ask what the last renewal increase was.`,
          check: buying
            ? 'Ask for the last full-year property-tax statement and a bindable insurance quote for each address.'
            : 'Ask what is excluded from rent: utilities, parking, pet rent, amenity fees.',
          resolves: resolves('Housing-cost shock'),
        },
        {
          id: 'rush-hour-back',
          time: '5:15 PM',
          title: 'Drive the commute back, at peak',
          purpose:
            'The evening return is usually the worse direction. Drive it before you decide anything.',
          check:
            'Was the return materially slower than the morning? By how many minutes?',
          resolves: resolves('Commute shock'),
        },
      ],
    },
    {
      key: 'day-2',
      label: 'Day 2 — Daily life and safety nets',
      focus:
        'Schools, healthcare, and what the neighbourhood is like when nobody is showing it to you.',
      stops: [
        {
          id: 'neighbourhood-walk',
          time: '8:00 AM',
          title: 'Walk your shortlisted neighbourhood on a weekday morning',
          purpose:
            'See who is out, what the traffic is like on the street itself, and whether the block is maintained.',
          check:
            'Would you walk this block after dark? Answer honestly on the ground.',
          resolves: 'Neighbourhood fit',
        },
        ...(hasKids
          ? [
              {
                id: 'school',
                time: '10:00 AM',
                title: `Visit ${context.nearestSchoolName ?? 'the assigned school'}`,
                purpose:
                  'Walk the perimeter at drop-off or pick-up, then ask the front office about enrolment and waitlists.',
                check:
                  'Is your address actually in this attendance zone? Zones do not follow city lines.',
                resolves: 'Education access',
              },
            ]
          : []),
        {
          id: 'hospital',
          time: '1:00 PM',
          title: `Drive to ${context.nearestHospitalName ?? 'the nearest major hospital'}`,
          purpose:
            'Time it from the home you are considering, in normal traffic, the way an emergency would happen.',
          check: `Your rule is a hospital within ${Math.round(context.dealBreakers.hospitalWithinMiles)} miles — does this address meet it?`,
          resolves: resolves('Healthcare access'),
        },
        {
          id: 'employers',
          time: '3:00 PM',
          title: 'Look at the fallback employers',
          purpose: context.topEmployers.length
            ? `Drive past ${context.topEmployers.slice(0, 3).join(', ')} — the employers you would turn to if the first job ended.`
            : 'Identify who else in this city hires your role, in case the first job ends.',
          check:
            'Could you name three employers here who would hire you next week?',
          resolves: resolves('Job-market concentration'),
        },
      ],
    },
    {
      key: 'day-3',
      label: 'Day 3 — The weekend test',
      focus:
        'Whether you would want to be here on a Saturday with nothing scheduled.',
      stops: [
        {
          id: 'saturday',
          time: '10:00 AM',
          title: 'Spend an unplanned Saturday',
          purpose:
            'No itinerary. Go where you would actually go — a park, a coffee shop, a gym, a library.',
          check: 'Did you find three places you would return to? Name them.',
          resolves: 'Community fit',
        },
        {
          id: 'airport',
          time: '2:00 PM',
          title: 'Drive to the airport',
          purpose:
            'Time it. Every trip back to family runs through this drive.',
          check:
            'Does the airport have a direct flight to the people you would visit most?',
          resolves: resolves('Distance from support network'),
        },
        {
          id: 'downtown-suburb',
          time: '5:00 PM',
          title: 'Compare downtown against the suburb',
          purpose:
            'Eat dinner in each. The trade-off between the two is the one most movers get wrong.',
          check: 'Which one did you relax in? That is the one to search first.',
          resolves: 'Neighbourhood fit',
        },
      ],
    },
  ]

  return {
    cityName,
    whenToVisit: worstSeason(climate),
    days,
    packing: [
      'A stopwatch or the clock app — time every drive yourself.',
      'The simulator numbers for this city, so you can check them against real quotes.',
      'A list of three questions per stop, written before you go.',
      climate && climate.hotDaysPerYear > 60
        ? 'Clothing for real heat — you are visiting on purpose in the hard season.'
        : 'Layers for the hard season you chose.',
    ],
    budgetNote:
      'Budget a research trip like a cost of the move, not a holiday: three nights, a rental car, and the fuel to drive the commutes twice.',
  }
}
