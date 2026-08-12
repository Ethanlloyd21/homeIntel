import { ExternalLink, GraduationCap, UsersRound } from 'lucide-react'
import type { NearbyCollege } from '../services/colleges'
import { fmt } from '../utils/formatters'
import LoadingSpinner from './LoadingSpinner'

export default function NearbyColleges({
  cityName,
  colleges,
  isLoading,
  isError,
}: {
  cityName: string
  colleges: NearbyCollege[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section className="card nearby-colleges">
      <div className="section-heading">
        <div>
          <small>HIGHER EDUCATION</small>
          <h3>Universities and colleges near {cityName}</h3>
        </div>
        <GraduationCap size={22} />
      </div>
      <p className="nearby-colleges-intro">
        Explore popular operating institutions within 50 miles of the selected
        city and the fields that represent their largest shares of completed
        programs.
      </p>

      {isLoading ? (
        <div className="loading-panel">
          <LoadingSpinner size={34} label="Loading nearby colleges" />
        </div>
      ) : isError ? (
        <div className="college-empty">
          College information is temporarily unavailable.
        </div>
      ) : colleges.length === 0 ? (
        <div className="college-empty">
          No operating College Scorecard institutions were found near {cityName}
          .
        </div>
      ) : (
        <div className="college-grid">
          {colleges.map((college) => (
            <article className="college-card" key={college.id}>
              <div className="college-logo" aria-hidden="true">
                {college.logoUrl ? (
                  <img src={college.logoUrl} alt="" />
                ) : (
                  <GraduationCap size={25} />
                )}
              </div>
              <div className="college-card-body">
                <div>
                  <span>{college.type}</span>
                  <h4>{college.name}</h4>
                  <small>
                    {college.location} · {college.distanceMiles.toFixed(0)}{' '}
                    miles away
                  </small>
                </div>
                <p>{college.knownFor}</p>
                <div className="college-card-footer">
                  <span>
                    <UsersRound size={15} />
                    {college.enrollment > 0
                      ? `${fmt.format(college.enrollment)} undergraduates`
                      : 'Enrollment unavailable'}
                  </span>
                  {college.website && (
                    <a href={college.website} target="_blank" rel="noreferrer">
                      Visit site <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="college-source-note">
        Source: U.S. Department of Education College Scorecard. “Known for” is
        based on the institution’s largest reported program-completion shares,
        not an editorial ranking.
      </p>
    </section>
  )
}
