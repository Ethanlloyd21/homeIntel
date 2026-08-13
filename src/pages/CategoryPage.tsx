import {
  Building2,
  BriefcaseBusiness,
  ChevronDown,
  CloudSun,
  Database,
  DollarSign,
  GraduationCap,
  Home,
  Landmark,
  Mountain,
  PersonStanding,
  ShieldAlert,
  Sparkles,
  ThermometerSun,
  Users,
  UsersRound,
  Waves,
  Wind,
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
import { useWeatherQuery } from '../hooks/useWeatherQuery'
import { compact, fmt, money } from '../utils/formatters'
import AnimatedValue from '../components/AnimatedValue'
import HousingMetricCard from '../components/HousingMetricCard'
import NearbyColleges from '../components/NearbyColleges'
import { useNearbyCollegesQuery } from '../hooks/useNearbyCollegesQuery'
import EmploymentSectorChart from '../components/EmploymentSectorChart'
import EconomicGrowthChart from '../components/EconomicGrowthChart'
import { useCurrentEconomyQuery } from '../hooks/useCurrentEconomyQuery'
import MajorEmployers from '../components/MajorEmployers'
import { useMajorEmployersQuery } from '../hooks/useMajorEmployersQuery'

const ZHVI_SOURCE =
  'https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'
const ZORI_SOURCE =
  'https://files.zillowstatic.com/research/public_csvs/zori/City_zori_uc_sfrcondomfr_sm_month.csv'
const ACS_HOME_VALUE_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/B25077.html'
const ACS_RENT_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/B25064.html'
const ACS_TENURE_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/B25003.html'
const CENSUS_POPULATION_SOURCE =
  'https://www.census.gov/programs-surveys/popest/data/data-sets.html'
const ACS_AGE_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/B01002.html'
const ACS_EDUCATION_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/B15003.html'
const ACS_HOUSEHOLD_SIZE_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/B25010.html'
const ACS_EMPLOYMENT_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/profile/groups/DP03.html'
const ACS_DETAILED_INDUSTRY_SOURCE =
  'https://api.census.gov/data/2024/acs/acs5/groups/C24030.html'
const FEMA_NRI_SOURCE = 'https://hazards.fema.gov/nri/data-resources'
const OPEN_METEO_SOURCE = 'https://open-meteo.com/en/docs'

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
  const currentEconomyQuery = useCurrentEconomyQuery(
    city,
    type === 'Employment',
  )
  const majorEmployersQuery = useMajorEmployersQuery(
    city,
    type === 'Employment',
  )
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
  const weatherQuery = useWeatherQuery(city, type === 'Environment')
  const collegesQuery = useNearbyCollegesQuery(city, type === 'People')
  const weather = weatherQuery.data
  const weatherStatus = weatherQuery.isPending ? (
    <LoadingSpinner label="Loading live weather" />
  ) : weatherQuery.isError ? (
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
              detail: `The average annual city growth rate across 2023 to 2024 and 2024 to 2025 was ${demographics.annualPopulationGrowthPercent >= 0 ? '+' : ''}${demographics.annualPopulationGrowthPercent.toFixed(1)}%. HomeIntel fits a least-squares linear trend to the official 2023, 2024, and 2025 estimates to calculate the ${demographics.estimateYear} value.`,
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
          'Average Census estimate',
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
      intro:
        'Relative natural-hazard loss potential for the selected Census tract, using FEMA data.',
      stats: [
        [
          'Loss potential',
          riskStatus ?? risk?.rating ?? 'Unavailable',
          risk ? `${risk.score} / 100` : 'FEMA Expected Annual Loss',
        ],
        [
          'Highest-loss hazard',
          riskStatus ?? risk?.hazards[0]?.label ?? 'Unavailable',
          risk?.hazards[0] ? `${risk.hazards[0].score} / 100` : 'No data',
        ],
        [
          'Inland flooding',
          riskStatus ??
            risk?.hazards.find((hazard) => hazard.label === 'Inland flooding')
              ?.score ??
            'No data',
          risk ? 'expected annual loss score' : 'FEMA index',
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
        [
          'Humidity',
          weatherStatus ?? `${weather?.current.relative_humidity_2m}%`,
          'current relative humidity',
        ],
        [
          'High / low',
          weatherStatus ??
            `${Math.round(weather?.daily.temperature_2m_max[0] ?? 0)}° / ${Math.round(weather?.daily.temperature_2m_min[0] ?? 0)}°`,
          'today’s forecast',
        ],
        [
          'Wind',
          weatherStatus ??
            `${Math.round(weather?.current.wind_speed_10m ?? 0)} mph`,
          'current speed at 10 meters',
        ],
        ['Forecast source', 'Open-Meteo', 'updated automatically'],
      ],
    },
  }
  const c = configs[type] ?? configs.Housing
  const Icon = c.icon
  const housingDetails = [
    {
      detail: housing?.homeValueNote.startsWith('ZHVI')
        ? 'Zillow Home Value Index (ZHVI) represents the typical value of homes in the middle tier of the city market. It is a modeled market index, not a median sale price or appraisal.'
        : 'The Census ACS estimate is the median respondent-reported value of owner-occupied housing units in the selected Census place.',
      sources: housing?.homeValueNote.startsWith('ZHVI')
        ? [{ label: 'Zillow Research — city ZHVI dataset', href: ZHVI_SOURCE }]
        : [
            {
              label: 'Census ACS table B25077 — median home value',
              href: ACS_HOME_VALUE_SOURCE,
            },
          ],
    },
    {
      detail: housing?.rentNote.startsWith('ZORI')
        ? 'Zillow Observed Rent Index (ZORI) estimates typical asking rent across the local rental market. It reflects listed market rents rather than what every existing tenant currently pays.'
        : 'The Census ACS estimate is median gross rent, which includes contract rent plus estimated tenant-paid utilities for occupied rental units.',
      sources: housing?.rentNote.startsWith('ZORI')
        ? [{ label: 'Zillow Research — city ZORI dataset', href: ZORI_SOURCE }]
        : [
            {
              label: 'Census ACS table B25064 — median gross rent',
              href: ACS_RENT_SOURCE,
            },
          ],
    },
    {
      detail:
        'Owner occupied is the share of occupied housing units whose occupants own the home. HomeIntel divides owner-occupied units by all owner- and renter-occupied units for the selected Census place.',
      sources: [
        {
          label: 'Census ACS table B25003 — housing tenure',
          href: ACS_TENURE_SOURCE,
        },
      ],
    },
    {
      detail:
        'HomeIntel matches the selected Census place to locally stored Zillow Research city series when available. Census ACS 2020–2024 five-year estimates provide housing tenure and serve as the fallback for value or rent.',
      sources: [
        {
          label: 'Zillow Research housing data',
          href: 'https://www.zillow.com/research/data/',
        },
        {
          label: 'Census ACS 2024 five-year API',
          href: 'https://api.census.gov/data/2024/acs/acs5.html',
        },
      ],
    },
  ]
  const peopleDetails = [
    {
      icon: UsersRound,
      detail: demographics
        ? `${demographics.currentPopulationNote}. The trend uses all three official annual population levels and reduces the influence of a single unusual yearly change.`
        : 'Population uses official Census city estimates and the latest available annual growth rate.',
      sources: [
        {
          label: 'U.S. Census Population Estimates datasets',
          href: CENSUS_POPULATION_SOURCE,
        },
      ],
    },
    {
      icon: PersonStanding,
      detail:
        'Median age is the age that divides the population into two equally sized groups: half of residents are younger and half are older. It is a 2020–2024 ACS five-year place estimate.',
      sources: [
        {
          label: 'Census ACS table B01002 — median age',
          href: ACS_AGE_SOURCE,
        },
      ],
    },
    {
      icon: GraduationCap,
      detail:
        "College educated is the share of residents age 25 and older whose highest attainment is a bachelor's, master's, professional, or doctoral degree.",
      sources: [
        {
          label: 'Census ACS table B15003 — educational attainment',
          href: ACS_EDUCATION_SOURCE,
        },
      ],
    },
    {
      icon: Users,
      detail:
        'Average household size is the average number of people living in occupied housing units. People living in group quarters, such as dormitories or institutions, are not included.',
      sources: [
        {
          label: 'Census ACS table B25010 — average household size',
          href: ACS_HOUSEHOLD_SIZE_SOURCE,
        },
      ],
    },
  ]
  const employmentDetails = [
    {
      icon: BriefcaseBusiness,
      detail:
        'Employment rate is the share of people in the civilian labor force who are employed. It excludes residents who are not participating in the labor force.',
    },
    {
      icon: DollarSign,
      detail:
        'Median worker earnings divides workers into two equal groups, with half earning more and half earning less. The ACS value is reported in inflation-adjusted dollars.',
    },
    {
      icon: UsersRound,
      detail:
        'Civilian labor force counts employed residents plus unemployed residents who are actively seeking work. It does not represent the number of jobs located inside the city.',
    },
    {
      icon: Building2,
      detail:
        'Top sector is the industry group employing the largest share of the city’s civilian employed population, based on Census ACS industry categories.',
    },
  ].map((item) => ({
    ...item,
    sources: [
      {
        label: 'Census ACS profile DP03 — economic characteristics',
        href: ACS_EMPLOYMENT_SOURCE,
      },
      {
        label: 'Census ACS table C24030 — detailed industries',
        href: ACS_DETAILED_INDUSTRY_SOURCE,
      },
    ],
  }))
  const riskDetails = [
    {
      icon: ShieldAlert,
      detail:
        'Loss potential is FEMA Expected Annual Loss for the selected Census tract. It combines modeled hazard frequency, exposure, and historic loss estimates; it is not the probability of a disaster at a specific property.',
    },
    {
      icon: Mountain,
      detail:
        'Highest-loss hazard is the natural hazard with the largest FEMA Expected Annual Loss score among the hazards available for the selected tract.',
    },
    {
      icon: Waves,
      detail:
        'Inland flooding reflects modeled riverine flooding loss potential. Property-level flood zones and insurance requirements require a separate address-level review.',
    },
    {
      icon: Landmark,
      detail:
        'Community resilience estimates the ability of a community to prepare for, adapt to, and recover from natural hazards. A higher score indicates greater modeled resilience.',
    },
  ].map((item) => ({
    ...item,
    sources: [
      {
        label: 'FEMA National Risk Index data resources',
        href: FEMA_NRI_SOURCE,
      },
    ],
  }))
  const environmentDetails = [
    {
      icon: CloudSun,
      detail:
        'Relative humidity describes how much moisture the air currently contains compared with the maximum it could hold at the same temperature.',
    },
    {
      icon: ThermometerSun,
      detail:
        'High and low are today’s modeled maximum and minimum air temperatures for the coordinates of the selected city.',
    },
    {
      icon: Wind,
      detail:
        'Wind speed is the current modeled speed at 10 meters above ground. Local terrain, buildings, and observation stations can produce different readings.',
    },
    {
      icon: Database,
      detail:
        'Open-Meteo combines weather models from national weather services. Values are coordinate-based forecasts and may differ from a nearby physical station.',
    },
  ].map((item) => ({
    ...item,
    sources: [
      {
        label: 'Open-Meteo forecast API documentation',
        href: OPEN_METEO_SOURCE,
      },
    ],
  }))
  const detailSets = {
    Housing: housingDetails,
    People: peopleDetails,
    Employment: employmentDetails,
    Risk: riskDetails,
    Environment: environmentDetails,
  }
  return (
    <div className={`category-page category-${type.toLowerCase()}`}>
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
        {c.stats.map(([label, value, note], index) => {
          const details = detailSets[type as keyof typeof detailSets]
          return details ? (
            <HousingMetricCard
              key={label}
              label={label}
              value={value}
              note={note}
              detail={details[index].detail}
              sources={details[index].sources}
              color={city.color}
              icon={'icon' in details[index] ? details[index].icon : undefined}
            />
          ) : (
            <article className="card" key={label}>
              <p>{label}</p>
              <strong>
                <AnimatedValue value={value} />
              </strong>
              <small>{note}</small>
            </article>
          )
        })}
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
        ) : type === 'Employment' ? (
          employment ? (
            <EmploymentSectorChart employment={employment} />
          ) : (
            <section className="card wide-chart housing-trend-empty">
              <div className="loading-panel">
                {employmentQuery.isPending ? (
                  <LoadingSpinner
                    size={34}
                    label="Loading employment sectors"
                  />
                ) : (
                  <p>Employment sector data is unavailable for this city.</p>
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
      {type === 'People' && (
        <NearbyColleges
          cityName={city.name}
          colleges={collegesQuery.data ?? []}
          isLoading={collegesQuery.isPending}
          isError={collegesQuery.isError}
        />
      )}
      {type === 'Employment' && employment && (
        <EconomicGrowthChart
          employment={employment}
          current={currentEconomyQuery.data}
          isCurrentLoading={currentEconomyQuery.isPending}
        />
      )}
      {type === 'Employment' && (
        <MajorEmployers
          cityName={city.name}
          employers={majorEmployersQuery.data ?? []}
          isLoading={majorEmployersQuery.isPending}
          isError={majorEmployersQuery.isError}
        />
      )}
    </div>
  )
}
