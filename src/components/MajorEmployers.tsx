import {
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  Factory,
  HeartPulse,
  Landmark,
  Plane,
  UsersRound,
  Zap,
} from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useState, type ComponentType } from 'react'
import type { MajorEmployer } from '../services/employers'
import { compact, fmt } from '../utils/formatters'
import LoadingSpinner from './LoadingSpinner'

const sectorOrder = [
  'Defense & government',
  'Technology',
  'Health & life sciences',
  'Advanced manufacturing',
  'Finance',
  'Energy',
  'Transportation',
]

const sectorIcons: Record<string, ComponentType<{ size?: number }>> = {
  'Defense & government': Landmark,
  Technology: Cpu,
  'Health & life sciences': HeartPulse,
  'Advanced manufacturing': Factory,
  Finance: Banknote,
  Energy: Zap,
  Transportation: Plane,
}

function companyStrength(company: MajorEmployer) {
  return (
    company.federalObligations ??
    company.employees ??
    (company.facilityBeds ?? 0) * 1_000
  )
}

const companiesPerPage = 6

export default function MajorEmployers({
  cityName,
  employers,
  isLoading,
  isError,
}: {
  cityName: string
  employers: MajorEmployer[]
  isLoading: boolean
  isError: boolean
}) {
  const [sectorPages, setSectorPages] = useState<Record<string, number>>({})

  const rankedSectorGroups = [...new Set(employers.map(({ sector }) => sector))]
    .map((sector) => ({
      sector,
      companies: employers
        .filter((employer) => employer.sector === sector)
        .sort((a, b) => companyStrength(b) - companyStrength(a)),
    }))
    .sort(
      (a, b) =>
        b.companies.length - a.companies.length ||
        sectorOrder.indexOf(a.sector) - sectorOrder.indexOf(b.sector),
    )
  const sectorGroups = rankedSectorGroups.slice(0, 4)
  const healthGroup = rankedSectorGroups.find(
    ({ sector }) => sector === 'Health & life sciences',
  )
  if (
    healthGroup &&
    !sectorGroups.some(({ sector }) => sector === healthGroup.sector)
  )
    sectorGroups.push(healthGroup)

  return (
    <section className="card major-employers">
      <div className="section-heading">
        <div>
          <small>REGIONAL EMPLOYMENT LANDSCAPE</small>
          <h3>Leading employers near {cityName}</h3>
        </div>
        <Building2 size={22} />
      </div>
      <p className="nearby-colleges-intro">
        Explore the leading sectors represented by major federal contractors and
        large strategic headquarters in the surrounding area, including major
        healthcare employers when available.
      </p>
      {isLoading ? (
        <div className="loading-panel">
          <LoadingSpinner size={34} label="Loading major employers" />
        </div>
      ) : isError ? (
        <p className="college-empty">
          Company information is temporarily unavailable.
        </p>
      ) : sectorGroups.length === 0 ? (
        <p className="college-empty">
          No qualifying major strategic employers were found nearby.
        </p>
      ) : (
        <Tabs.Root
          className="employer-tabs"
          defaultValue={sectorGroups[0].sector}
          onValueChange={(sector) =>
            setSectorPages((current) => ({ ...current, [sector]: 1 }))
          }
        >
          <Tabs.List
            className="employer-tab-list"
            aria-label="Employer sectors"
          >
            {sectorGroups.map(({ sector, companies }) => {
              const SectorIcon = sectorIcons[sector] ?? Building2
              return (
                <Tabs.Trigger
                  className="employer-tab-trigger"
                  value={sector}
                  key={sector}
                >
                  <SectorIcon size={18} />
                  <span>{sector}</span>
                  <small>{companies.length}</small>
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>
          {sectorGroups.map(({ sector, companies }) => {
            const SectorIcon = sectorIcons[sector] ?? Building2
            const totalPages = Math.ceil(companies.length / companiesPerPage)
            const currentPage = Math.min(sectorPages[sector] ?? 1, totalPages)
            const startIndex = (currentPage - 1) * companiesPerPage
            const visibleCompanies = companies.slice(
              startIndex,
              startIndex + companiesPerPage,
            )
            const changePage = (page: number) =>
              setSectorPages((current) => ({ ...current, [sector]: page }))
            return (
              <Tabs.Content
                className="employer-tab-content"
                value={sector}
                key={sector}
              >
                <div className="employer-grid">
                  {visibleCompanies.map((employer) => (
                    <article className="employer-card" key={employer.id}>
                      <div className="employer-logo">
                        <SectorIcon size={26} />
                      </div>
                      <div>
                        <div className="employer-title-row">
                          <h4>{employer.name}</h4>
                          {employer.website && (
                            <a
                              className="employer-website-link"
                              href={employer.website}
                              target="_blank"
                              rel="noreferrer"
                              title={`Visit ${employer.name} website`}
                              aria-label={`Visit ${employer.name} website`}
                            >
                              <ExternalLink size={17} />
                            </a>
                          )}
                        </div>
                        <span>{employer.sector}</span>
                        <p>{employer.description}</p>
                        <div className="employer-meta">
                          <small>
                            <UsersRound size={14} />
                            {employer.federalObligations
                              ? `$${compact(employer.federalObligations)} in recent federal contracts`
                              : employer.source === 'HIFLD'
                                ? `${employer.facilityBeds ? `${fmt.format(employer.facilityBeds)} beds · ` : ''}${employer.distanceMiles?.toFixed(1)} miles away`
                                : employer.employees
                                  ? `${fmt.format(employer.employees)} reported employees${employer.distanceMiles !== null ? ` - ${employer.distanceMiles.toFixed(1)} miles from city center` : ''}`
                                  : 'Employee count not reported'}
                          </small>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav
                    className="employer-pagination"
                    aria-label={`${sector} companies pagination`}
                  >
                    <span>
                      Showing {startIndex + 1}-
                      {Math.min(
                        startIndex + companiesPerPage,
                        companies.length,
                      )}{' '}
                      of {companies.length}
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label={`Previous ${sector} companies`}
                      >
                        <ChevronLeft size={17} />
                        Previous
                      </button>
                      <small>
                        {currentPage} / {totalPages}
                      </small>
                      <button
                        type="button"
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label={`Next ${sector} companies`}
                      >
                        Next
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </nav>
                )}
              </Tabs.Content>
            )
          })}
        </Tabs.Root>
      )}
      <p className="sector-source-note">
        Sources: USAspending federal contract transactions by nearby place of
        performance, Wikidata's CC0 knowledge base, and the U.S. Hospitals HIFLD
        feature service. Federal totals cover the latest three years and
        indicate regional contract activity, not local employee counts. Hospital
        beds, staff, and websites appear when reported by the source.
      </p>
    </section>
  )
}
