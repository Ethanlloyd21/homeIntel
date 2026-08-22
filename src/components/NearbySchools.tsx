import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  School,
  Search,
  UsersRound,
} from 'lucide-react'
import { Collapsible, Tabs } from 'radix-ui'
import { useState } from 'react'
import LoadingSpinner from 'components/LoadingSpinner'
import type {
  NearbySchool,
  NearbySchools as NearbySchoolsData,
} from 'services/schools'
import { fmt } from 'utils/formatters'

const schoolsPerPage = 6
const schoolTabs = [
  { value: 'preK', label: 'Pre-K', title: 'Pre-K programs' },
  {
    value: 'kindergarten',
    label: 'Kindergarten',
    title: 'Kindergarten programs',
  },
  { value: 'grades1To6', label: 'Grades 1-6', title: 'Grades 1-6 schools' },
  {
    value: 'middleHigh',
    label: 'Middle & high',
    title: 'Middle and high schools',
  },
  {
    value: 'online',
    label: 'Online',
    title: 'Statewide online schools',
  },
] as const

const reported = (value: string | number | null) => {
  if (
    value === null ||
    value === '' ||
    (typeof value === 'number' && value < 0)
  )
    return 'Not reported'
  return String(value)
}

const yesNo = (value: number | null) => {
  if (value === 1) return 'Yes'
  if (value === 0) return 'No'
  return 'Not reported'
}

const grade = (value: number | null) => {
  if (value === null) return 'Not reported'
  if (value === -1) return 'Pre-K'
  if (value === 0) return 'Kindergarten'
  if (value === 13) return 'Ungraded'
  return value > 0 ? `Grade ${value}` : 'Not reported'
}

const codedValue = (value: number | null) =>
  value === null || value < 0 ? 'Not reported' : `Code ${value}`

const countWithShare = (value: number | null, enrollment: number) => {
  if (value === null || value < 0) return 'Not reported'
  const share =
    enrollment > 0 ? ` (${((value / enrollment) * 100).toFixed(1)}%)` : ''
  return `${fmt.format(value)}${share}`
}

const SchoolProfile = ({ school }: { school: NearbySchool }) => {
  const metadata = school.metadata
  const gradeBands = [
    metadata.elementary === 1 ? 'Elementary' : '',
    metadata.middle === 1 ? 'Middle' : '',
    metadata.high === 1 ? 'High school' : '',
    metadata.ungraded === 1 ? 'Ungraded' : '',
  ].filter(Boolean)

  return (
    <div className="school-profile-summary">
      <div>
        <span>School profile</span>
        {(school.magnet || school.charter) && (
          <b>{school.magnet ? 'Magnet' : 'Charter'}</b>
        )}
      </div>
      <dl>
        <div>
          <dt>Grade range</dt>
          <dd>
            {grade(metadata.lowestGrade)} - {grade(metadata.highestGrade)}
          </dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>
            {metadata.schoolType === 1
              ? 'Regular school'
              : `Code ${metadata.schoolType}`}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            {metadata.schoolStatus === 1
              ? 'Open'
              : `Code ${metadata.schoolStatus}`}
          </dd>
        </div>
        <div>
          <dt>Grade bands</dt>
          <dd>{gradeBands.join(', ') || 'Not reported'}</dd>
        </div>
        <div>
          <dt>Teachers, FTE</dt>
          <dd>
            {school.teachersFte === null
              ? 'Not reported'
              : school.teachersFte.toFixed(1)}
          </dd>
        </div>
        {school.level !== 'Statewide online' && (
          <div>
            <dt>From city center</dt>
            <dd>{school.distanceMiles.toFixed(1)} miles</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

const SchoolDetails = ({ school }: { school: NearbySchool }) => {
  const metadata = school.metadata
  const sections = [
    {
      title: 'Identity and contact',
      rows: [
        ['NCES school ID', metadata.ncesSchoolId],
        ['State school ID', metadata.stateSchoolId],
        ['District', school.district],
        ['NCES district ID', metadata.ncesDistrictId],
        ['State district ID', metadata.stateDistrictId],
        ['Physical address', school.location],
        ['Mailing address', metadata.mailingAddress],
        ['Phone', metadata.phone],
        ['Coordinates', `${metadata.latitude}, ${metadata.longitude}`],
      ],
    },
    {
      title: 'Programs and student access',
      rows: [
        ['Charter', school.charter ? 'Yes' : 'No'],
        ['Magnet', school.magnet ? 'Yes' : 'No'],
        ['Virtual school', yesNo(metadata.virtual)],
        ['Shared-time school', yesNo(metadata.sharedTime)],
        ['Bureau of Indian Education', yesNo(metadata.bureauIndianEducation)],
        ['Title I status', codedValue(metadata.titleIStatus)],
        ['Title I eligible', yesNo(metadata.titleIEligible)],
        ['Title I schoolwide', yesNo(metadata.titleISchoolwide)],
        ['Free lunch', countWithShare(metadata.freeLunch, school.enrollment)],
        [
          'Reduced-price lunch',
          countWithShare(metadata.reducedPriceLunch, school.enrollment),
        ],
        [
          'Free or reduced-price lunch',
          countWithShare(metadata.freeOrReducedLunch, school.enrollment),
        ],
        [
          'Direct certification',
          countWithShare(metadata.directCertification, school.enrollment),
        ],
        ['Lunch-program status', codedValue(metadata.lunchProgram)],
      ],
    },
    {
      title: 'Geography and reporting',
      rows: [
        ['County FIPS', metadata.countyCode],
        ['Locale', codedValue(metadata.localeCode)],
        ['Metro area (CBSA)', metadata.metroAreaCode],
        ['Combined statistical area', metadata.combinedStatisticalAreaCode],
        ['Congressional district', reported(metadata.congressionalDistrict)],
        ['Lower legislative district', metadata.lowerLegislativeDistrict],
        ['Upper legislative district', metadata.upperLegislativeDistrict],
        ['CCD reporting year', school.year],
      ],
    },
  ]

  return (
    <Collapsible.Root className="school-details">
      <div className="school-metrics">
        <span>
          <UsersRound size={15} /> {fmt.format(school.enrollment)} students
        </span>
        <span>
          {school.studentTeacherRatio === null
            ? 'Students per teacher not reported'
            : `${school.studentTeacherRatio.toFixed(1)}:1 students per teacher`}
        </span>
        <Collapsible.Trigger className="school-details-trigger">
          View details <ChevronDown size={16} />
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content className="school-details-content">
        {sections.map((section) => (
          <section key={section.title}>
            <h6>{section.title}</h6>
            <dl>
              {section.rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{reported(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

const SchoolList = ({
  title,
  schools,
}: {
  title: string
  schools: NearbySchool[]
}) => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()
  const filteredSchools = normalizedSearch
    ? schools.filter((school) =>
        [school.name, school.district, school.location].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
    : schools
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSchools.length / schoolsPerPage),
  )
  const startIndex = (page - 1) * schoolsPerPage
  const visibleSchools = filteredSchools.slice(
    startIndex,
    startIndex + schoolsPerPage,
  )

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  return (
    <div className="school-group">
      <div className="school-group-heading">
        <h4>{title}</h4>
        <label className="school-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label={`Search ${title.toLowerCase()}`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search school, district, or address"
          />
        </label>
      </div>
      {filteredSchools.length === 0 ? (
        <div className="college-empty">
          {search
            ? `No schools match “${search}”.`
            : 'No matching public schools found.'}
        </div>
      ) : (
        <>
          <div className="school-grid">
            {visibleSchools.map((school, index) => (
              <article className="school-card" key={school.id}>
                <div
                  className="school-rank"
                  aria-label={`Position ${startIndex + index + 1}`}
                >
                  {startIndex + index + 1}
                </div>
                <div className="school-card-body">
                  <div className="school-card-heading">
                    <div>
                      <span>{school.level}</span>
                      <h5>{school.name}</h5>
                      <p>{school.district}</p>
                      <small>{school.location}</small>
                    </div>
                    <SchoolProfile school={school} />
                  </div>
                  <SchoolDetails school={school} />
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              className="employer-pagination school-pagination"
              aria-label={`${title} pagination`}
            >
              <span>
                Showing {startIndex + 1}-
                {Math.min(startIndex + schoolsPerPage, filteredSchools.length)}{' '}
                of {filteredSchools.length}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                  aria-label={`Previous ${title.toLowerCase()}`}
                >
                  <ChevronLeft size={17} /> Previous
                </button>
                <small>
                  {page} / {totalPages}
                </small>
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page === totalPages}
                  aria-label={`Next ${title.toLowerCase()}`}
                >
                  Next <ChevronRight size={17} />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

const NearbySchools = ({
  cityName,
  schools,
  isLoading,
  isError,
}: {
  cityName: string
  schools?: NearbySchoolsData
  isLoading: boolean
  isError: boolean
}) => (
  <section className="card nearby-schools">
    <div className="section-heading">
      <div>
        <small>K-12 EDUCATION</small>
        <h3>Public schools in {cityName}</h3>
      </div>
      <School size={22} />
    </div>
    <p className="nearby-colleges-intro">
      Browse local public schools by reported grade band, or use Online to view
      fully virtual public schools across the selected city&apos;s state. A
      school may appear in multiple grade tabs. Results are ordered by lower
      student-to-teacher ratios when available, then enrollment; this is a
      staffing comparison, not an academic quality rating.
    </p>
    {isLoading ? (
      <div className="loading-panel">
        <LoadingSpinner size={34} label="Loading public schools" />
      </div>
    ) : isError ? (
      <div className="college-empty">
        Public school information is temporarily unavailable.
      </div>
    ) : (
      <Tabs.Root className="school-tabs" defaultValue="preK" key={cityName}>
        <Tabs.List className="school-tab-list" aria-label="School grade bands">
          {schoolTabs.map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value}>
              {tab.label}
              <span>{schools?.[tab.value].length ?? 0}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {schoolTabs.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value}>
            <SchoolList
              title={tab.title}
              schools={schools?.[tab.value] ?? []}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    )}
    <p className="college-source-note">
      Source: Urban Institute Education Data Portal, U.S. Department of
      Education Common Core of Data (CCD), 2024. Staffing ratios are calculated
      from reported enrollment and full-time-equivalent teachers. Verify school
      programs, attendance boundaries, and current staffing with the district.
    </p>
  </section>
)

export default NearbySchools
