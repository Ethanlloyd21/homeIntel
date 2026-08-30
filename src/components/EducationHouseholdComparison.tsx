import { ChevronDown, GraduationCap } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import type { DemographicsData } from 'services/demographics'

const comparisonColors = ['#5968e8', '#27a87b', '#e5a43a']

const EducationHouseholdComparison = ({
  demographics,
}: {
  demographics: DemographicsData
}) => {
  if (demographics.educationHouseholdComparison.length !== 3) return null

  return (
    <Collapsible.Root asChild>
      <section className="card education-household-section education-dropdown">
        <Collapsible.Trigger className="education-dropdown-trigger">
          <div>
            <small>EDUCATION &amp; HOUSEHOLD</small>
            <h3>City, state, and national comparison</h3>
          </div>
          <span className="education-dropdown-action">
            <GraduationCap size={22} />
            <span className="education-dropdown-show">View data</span>
            <span className="education-dropdown-hide">Hide data</span>
            <ChevronDown className="education-dropdown-chevron" size={19} />
          </span>
        </Collapsible.Trigger>
        <p className="nearby-colleges-intro education-dropdown-summary">
          Adults age 25+ · 2020–2024 ACS
        </p>
        <Collapsible.Content className="education-dropdown-content">
          <div className="comparison-key">
            {demographics.educationHouseholdComparison.map((item, index) => (
              <span key={item.geography}>
                <i style={{ background: comparisonColors[index] }} />
                {item.geography}
              </span>
            ))}
          </div>
          <div className="education-comparison-grid">
            {[
              { label: "Bachelor's degree", key: 'bachelorsPercent' as const },
              {
                label: 'Graduate or professional degree',
                key: 'graduatePercent' as const,
              },
              {
                label: "Bachelor's degree or higher",
                key: 'bachelorsOrHigherPercent' as const,
              },
            ].map((metric) => (
              <article key={metric.key}>
                <h5>{metric.label}</h5>
                {demographics.educationHouseholdComparison.map(
                  (item, index) => (
                    <div className="comparison-bar-row" key={item.geography}>
                      <span>{item.geography}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.min(item[metric.key], 100)}%`,
                            background: comparisonColors[index],
                          }}
                        />
                      </div>
                      <strong>{item[metric.key].toFixed(1)}%</strong>
                    </div>
                  ),
                )}
              </article>
            ))}
            <article className="household-comparison-card">
              <h5>Average household size</h5>
              {demographics.educationHouseholdComparison.map((item, index) => (
                <div className="comparison-bar-row" key={item.geography}>
                  <span>{item.geography}</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.min((item.averageHouseholdSize / 5) * 100, 100)}%`,
                        background: comparisonColors[index],
                      }}
                    />
                  </div>
                  <strong>{item.averageHouseholdSize.toFixed(2)}</strong>
                </div>
              ))}
              <small>People per occupied household</small>
            </article>
          </div>
          <p className="education-household-source">
            Source: U.S. Census Bureau 2020-2024 ACS five-year tables B15003 and
            B25010. Education percentages use the population age 25 and older.
            Graduate includes master's, professional, and doctoral degrees.
            Estimates omit margins of error.
          </p>
        </Collapsible.Content>
      </section>
    </Collapsible.Root>
  )
}

export default EducationHouseholdComparison
