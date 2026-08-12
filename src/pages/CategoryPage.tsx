import {
  Building2,
  ChevronDown,
  CloudSun,
  Home,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import PeopleProfileChart from '../components/PeopleProfileChart'
import HousingTrendChart from '../components/HousingTrendChart'
import type { City } from '../data/cities'
import { useEmploymentQuery } from '../hooks/useEmploymentQuery'
import { useDemographicsQuery } from '../hooks/useDemographicsQuery'
import { useHousingQuery } from '../hooks/useHousingQuery'
import { useRiskQuery } from '../hooks/useRiskQuery'
import { compact, fmt, money } from '../utils/formatters'
import MiniTrend from '../components/MiniTrend'
import AnimatedValue from '../components/AnimatedValue'

export default function CategoryPage({
  type,
  city,
}: {
  type: string
  city: City
}) {
  const housingQuery = useHousingQuery(city, type === 'Housing')
  const housing = housingQuery.data
  const demographicsQuery = useDemographicsQuery(city, type === 'People')
  const demographics = demographicsQuery.data
  const demographicsStatus = demographicsQuery.isPending ? (
    <LoadingSpinner label="Loading Census demographics" />
  ) : demographicsQuery.isError ? (
    'Unavailable'
  ) : null
  const employmentQuery = useEmploymentQuery(city, type === 'Employment')
  const employment = employmentQuery.data
  const employmentStatus = employmentQuery.isPending ? (
    <LoadingSpinner label="Loading Census employment data" />
  ) : employmentQuery.isError ? (
    'Unavailable'
  ) : null
  const riskQuery = useRiskQuery(city, type === 'Risk')
  const risk = riskQuery.data
  const riskStatus = riskQuery.isPending ? (
    <LoadingSpinner label="Loading FEMA risk data" />
  ) : riskQuery.isError ? (
    'Unavailable'
  ) : null
  const housingStatus = housingQuery.isPending ? (
    <LoadingSpinner label="Loading housing data" />
  ) : housingQuery.isError ? (
    'Setup required'
  ) : null
  const housingNote =
    housingQuery.error instanceof Error
      ? housingQuery.error.message
      : '2020-2024 ACS estimate'
  const historyChange = (values: { value: number }[]) => {
    if (values.length < 2 || values[0].value === 0) return null
    return ((values.at(-1)!.value - values[0].value) / values[0].value) * 100
  }
  const describeChange = (value: number | null, subject: string) => {
    if (value === null)
      return `${subject} history is not available for this city.`
    const direction = value >= 0 ? 'increased' : 'decreased'
    return `${subject} ${direction} ${Math.abs(value).toFixed(1)}% across the available Zillow history.`
  }
  const homeValueChange = housing
    ? historyChange(housing.homeValueHistory)
    : null
  const rentChange = housing ? historyChange(housing.rentHistory) : null
  const priceToAnnualRent =
    housing && housing.medianRent > 0
      ? housing.medianHomeValue / (housing.medianRent * 12)
      : null
  const briefItems =
    type === 'Housing' && housing
      ? [
          {
            title: 'Home-value direction.',
            detail: describeChange(homeValueChange, 'Typical home values'),
          },
          {
            title: 'Rental pressure.',
            detail: describeChange(rentChange, 'Typical market rent'),
          },
          {
            title: 'Ownership mix.',
            detail: `${housing.ownerOccupiedPercent.toFixed(1)}% of occupied homes are owner-occupied; ${(100 - housing.ownerOccupiedPercent).toFixed(1)}% are renter-occupied.`,
          },
          {
            title: 'Price-to-rent context.',
            detail: priceToAnnualRent
              ? `The typical home value equals about ${priceToAnnualRent.toFixed(1)} years of typical annual rent. This is a market comparison, not a complete buy-versus-rent calculation.`
              : 'There is not enough price and rent data for this comparison.',
          },
          {
            title: 'Read the sources carefully.',
            detail:
              'Market values and rents use Zillow research series when available; housing tenure uses the 2020–2024 Census ACS estimate.',
          },
        ]
      : type === 'People' && demographics
        ? [
            {
              title: 'City population trend.',
              detail: `The official 2024–2025 city growth rate was ${demographics.annualPopulationGrowthPercent >= 0 ? '+' : ''}${demographics.annualPopulationGrowthPercent.toFixed(1)}%. Applying that rate once to 2025 produces the ${demographics.estimateYear} calculated estimate.`,
            },
            {
              title: 'Age profile.',
              detail: `The median resident is ${demographics.medianAge.toFixed(1)} years old, which helps frame housing, transportation, and service needs.`,
            },
            {
              title: 'Education base.',
              detail: `${demographics.collegeEducatedPercent.toFixed(1)}% of adults age 25 and older hold a bachelor's degree or higher.`,
            },
            {
              title: 'Household composition.',
              detail: `The average occupied household contains ${demographics.averageHouseholdSize.toFixed(2)} people.`,
            },
            {
              title: 'International community.',
              detail: `${demographics.foreignBornPercent.toFixed(1)}% of residents are foreign born, based on Census place-level estimates.`,
            },
          ]
        : [
            {
              title: 'Momentum is holding.',
              detail:
                'The latest indicators remain above the five-year baseline.',
            },
            {
              title: 'Regional context matters.',
              detail: `${city.name} should be evaluated against comparable nearby cities.`,
            },
            {
              title: 'Watch the tradeoffs.',
              detail:
                'Review multiple indicators together before making a location decision.',
            },
          ]

  const configs: Record<
    string,
    {
      icon: typeof Home
      title: string
      intro: string
      stats: [string, ReactNode, ReactNode][]
    }
  > = {
    Housing: {
      icon: Home,
      title: 'Housing market',
      intro: 'Understand costs, tenure and local supply pressure.',
      stats: [
        [
          'Median home value',
          housingStatus ?? money(housing?.medianHomeValue ?? 0),
          housingQuery.isError
            ? housingNote
            : (housing?.homeValueNote ?? 'Zillow ZHVI'),
        ],
        [
          'Median gross rent',
          housingStatus ?? money(housing?.medianRent ?? 0),
          housingQuery.isError
            ? housingNote
            : (housing?.rentNote ?? 'Zillow ZORI'),
        ],
        [
          'Owner occupied',
          housingStatus ?? `${housing?.ownerOccupiedPercent.toFixed(1)}%`,
          'of occupied housing units',
        ],
        [
          'Data source',
          housingStatus ?? 'Zillow + Census',
          housing?.sourceName ?? 'Zillow Research and ACS',
        ],
      ],
    },
    People: {
      icon: Users,
      title: 'People & demographics',
      intro: 'A clear portrait of who lives here and how the city is changing.',
      stats: [
        [
          'Population',
          demographicsStatus ??
            fmt.format(demographics?.estimatedCurrentPopulation ?? 0),
          demographics
            ? demographics.currentPopulationNote
            : 'Calculated from Census growth',
        ],
        [
          'Median age',
          demographicsStatus ?? demographics?.medianAge.toFixed(1) ?? 'N/A',
          'years old',
        ],
        [
          'College educated',
          demographicsStatus ??
            `${demographics?.collegeEducatedPercent.toFixed(1)}%`,
          "bachelor's degree or higher",
        ],
        [
          'Household size',
          demographicsStatus ??
            demographics?.averageHouseholdSize.toFixed(2) ??
            'N/A',
          'people per occupied household',
        ],
      ],
    },
    Employment: {
      icon: Building2,
      title: 'Employment & economy',
      intro: 'See the industries and occupations powering the local economy.',
      stats: [
        [
          'Employment rate',
          employmentStatus ?? `${employment?.employmentRate.toFixed(1)}%`,
          'civilian labor force employed',
        ],
        [
          'Median worker earnings',
          employmentStatus ?? money(employment?.medianWorkerEarnings ?? 0),
          '2024 inflation-adjusted dollars',
        ],
        [
          'Labor force',
          employmentStatus ?? compact(employment?.laborForce ?? 0),
          'civilian workers',
        ],
        [
          'Top sector',
          employmentStatus ?? employment?.industries[0]?.name ?? 'Unavailable',
          employment?.industries[0]
            ? `${employment.industries[0].percent.toFixed(1)}% of workers`
            : 'Census ACS',
        ],
      ],
    },
    Risk: {
      icon: ShieldAlert,
      title: 'Risk & resilience',
      intro: 'Natural hazard exposure from trusted federal datasets.',
      stats: [
        [
          'Overall risk',
          riskStatus ?? risk?.rating ?? 'Unavailable',
          risk ? `${risk.score} / 100` : 'FEMA National Risk Index',
        ],
        [
          'Top exposure',
          riskStatus ?? risk?.hazards[0]?.label ?? 'Unavailable',
          risk?.hazards[0] ? `${risk.hazards[0].score} / 100` : 'No data',
        ],
        [
          'Inland flooding',
          riskStatus ??
            risk?.hazards.find((hazard) => hazard.label === 'Inland flooding')
              ?.score ??
            'No data',
          risk ? 'score out of 100' : 'FEMA index',
        ],
        [
          'Resilience',
          riskStatus ?? risk?.resilienceRating ?? 'No data',
          risk?.resilienceScore
            ? `${risk.resilienceScore} / 100`
            : 'FEMA score',
        ],
      ],
    },
    Environment: {
      icon: CloudSun,
      title: 'Environment & climate',
      intro: 'Weather, air quality and climate extremes in context.',
      stats: [
        ['Current weather', 'Live', 'see the Overview page'],
        ['Forecast source', 'Open-Meteo', 'updated automatically'],
        ['Annual rainfall', '12.1 in', '30-year normal'],
        ['Sunny days', '266', 'per year'],
      ],
    },
  }
  const c = configs[type] ?? configs.Housing
  const Icon = c.icon
  return (
    <div className="category-page">
      <div className="category-hero">
        <div className="category-icon">
          <Icon size={25} />
        </div>
        <div>
          <p className="eyebrow">
            {city.name.toUpperCase()}, {city.state}
          </p>
          <h2>{c.title}</h2>
          <span>{c.intro}</span>
        </div>
      </div>
      <div className="category-stats">
        {c.stats.map(([label, value, note]) => (
          <article className="card" key={label}>
            <p>{label}</p>
            <strong>
              <AnimatedValue value={value} />
            </strong>
            <small>{note}</small>
            <MiniTrend color={city.color} />
          </article>
        ))}
      </div>
      <div className="category-content">
        {type === 'Housing' ? (
          housing ? (
            <HousingTrendChart housing={housing} color={city.color} />
          ) : (
            <section className="card wide-chart housing-trend-empty">
              <div className="section-heading">
                <div>
                  <small>ZILLOW MARKET HISTORY</small>
                  <h3>Housing market trend</h3>
                </div>
              </div>
              <div className="loading-panel">
                {housingQuery.isPending ? (
                  <LoadingSpinner size={34} label="Loading housing history" />
                ) : (
                  <p>Historical Zillow data is not available for this city.</p>
                )}
              </div>
            </section>
          )
        ) : type === 'People' ? (
          demographics ? (
            <PeopleProfileChart
              demographics={demographics}
              color={city.color}
            />
          ) : (
            <section className="card wide-chart housing-trend-empty">
              <div className="loading-panel">
                {demographicsQuery.isPending ? (
                  <LoadingSpinner size={34} label="Loading people profile" />
                ) : (
                  <p>People profile data is unavailable for this city.</p>
                )}
              </div>
            </section>
          )
        ) : (
          <section className="card wide-chart">
            <div className="section-heading">
              <div>
                <small>5-YEAR TREND</small>
                <h3>{type} outlook</h3>
              </div>
              <button>
                2020-2024 ACS <ChevronDown size={14} />
              </button>
            </div>
            <svg viewBox="0 0 800 270" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={city.color} stopOpacity=".25" />
                  <stop offset="1" stopColor={city.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="grid-lines">
                <line x1="0" y1="35" x2="800" y2="35" />
                <line x1="0" y1="100" x2="800" y2="100" />
                <line x1="0" y1="165" x2="800" y2="165" />
                <line x1="0" y1="230" x2="800" y2="230" />
              </g>
              <path
                className="chart-area-enter"
                d="M0 212 C80 205,110 190,165 194 S270 148,335 157 S430 126,500 133 S600 82,665 100 S745 58,800 52 L800 270 L0 270Z"
                fill="url(#area)"
              />
              <path
                className="chart-line-enter"
                d="M0 212 C80 205,110 190,165 194 S270 148,335 157 S430 126,500 133 S600 82,665 100 S745 58,800 52"
                fill="none"
                stroke={city.color}
                strokeWidth="4"
              />
            </svg>
            <div className="chart-years">
              <span>2019</span>
              <span>2020</span>
              <span>2021</span>
              <span>2022</span>
              <span>2023</span>
              <span>2024</span>
              <span>2025</span>
              <span>2026</span>
            </div>
          </section>
        )}
        <aside className="card insight-list">
          <div className="section-heading">
            <div>
              <small>HOMEINTEL BRIEF</small>
              <h3>What this means</h3>
            </div>
            <Sparkles size={18} />
          </div>
          {briefItems.map((item, index) => (
            <div className="insight" key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>
                <b>{item.title}</b> {item.detail}
              </p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
