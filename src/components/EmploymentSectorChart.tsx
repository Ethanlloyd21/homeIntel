import { useState } from 'react'
import type { EmploymentData } from 'services/employment'

const colors = [
  '#4f8fd8',
  '#278167',
  '#725bc3',
  '#d36d52',
  '#d29a32',
  '#3e9ea8',
  '#9b65a5',
  '#64748b',
  '#65a65e',
  '#b96d8a',
  '#4674a8',
  '#9a7b4f',
  '#568b78',
  '#7d6eab',
]

const professionalServicePositions = [
  {
    service: 'Legal services',
    positions: 'Lawyers, paralegals, legal assistants, and compliance analysts',
  },
  {
    service: 'Accounting and payroll',
    positions:
      'Accountants, auditors, bookkeepers, tax specialists, and payroll specialists',
  },
  {
    service: 'Architecture and engineering',
    positions:
      'Architects, civil engineers, mechanical engineers, electrical engineers, and drafters',
  },
  {
    service: 'Computer systems design',
    positions:
      'Software developers, systems analysts, cybersecurity specialists, network administrators, and IT consultants',
  },
  {
    service: 'Management and technical consulting',
    positions:
      'Management analysts, business consultants, project managers, and technical advisers',
  },
  {
    service: 'Scientific research and development',
    positions:
      'Research scientists, laboratory technicians, research engineers, and data scientists',
  },
  {
    service: 'Specialized design',
    positions:
      'Graphic designers, industrial designers, interior designers, and UX/UI designers',
  },
  {
    service: 'Advertising and public relations',
    positions:
      'Marketing specialists, market research analysts, advertising professionals, and public relations specialists',
  },
  {
    service: 'Other professional services',
    positions:
      'Veterinarians, translators, photographers, and other specialized technical professionals',
  },
]

const EmploymentSectorChart = ({
  employment,
}: {
  employment: EmploymentData
}) => {
  const sectors = employment.industries.filter((sector) => sector.percent > 0)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeSector = sectors[activeIndex] ?? sectors[0]
  const professionalSector = sectors.find(
    ({ name }) => name === 'Professional services',
  )
  const sectorOffsets = sectors.map((_, index) =>
    sectors
      .slice(0, index)
      .reduce((total, sector) => total + sector.percent, 0),
  )

  return (
    <section className="card wide-chart employment-sector-chart">
      <div className="section-heading">
        <div>
          <small>CENSUS INDUSTRY MIX</small>
          <h3>Employment by sector</h3>
        </div>
        <span className="people-period">2020–2024 ACS</span>
      </div>
      <div className="sector-chart-layout">
        <div className="sector-donut-wrap">
          <svg
            className="sector-donut"
            viewBox="0 0 220 220"
            role="img"
            aria-label="Employment percentage by industry sector"
          >
            <circle className="sector-donut-track" cx="110" cy="110" r="78" />
            {sectors.map((sector, index) => {
              return (
                <circle
                  key={sector.name}
                  className={`sector-donut-slice ${activeIndex === index ? 'active' : ''}`}
                  cx="110"
                  cy="110"
                  r="78"
                  pathLength="100"
                  stroke={colors[index % colors.length]}
                  strokeDasharray={`${sector.percent} ${100 - sector.percent}`}
                  strokeDashoffset={-sectorOffsets[index]}
                  tabIndex={0}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  <title>
                    {sector.name}: {sector.percent.toFixed(1)}%
                  </title>
                </circle>
              )
            })}
          </svg>
          <div className="sector-donut-value">
            <strong>{activeSector?.percent.toFixed(1) ?? '0.0'}%</strong>
            <span>{activeSector?.name ?? 'No sector data'}</span>
          </div>
        </div>

        <div className="sector-legend">
          {sectors.map((sector, index) => (
            <button
              type="button"
              className={activeIndex === index ? 'active' : ''}
              key={sector.name}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            >
              <i style={{ background: colors[index % colors.length] }} />
              <span>{sector.name}</span>
              <strong>{sector.percent.toFixed(1)}%</strong>
            </button>
          ))}
        </div>
      </div>

      {professionalSector && (
        <section className="sector-breakdown-section">
          <div>
            <small>PROFESSIONAL SERVICES POSITIONS</small>
            <h4>Jobs commonly found in professional services</h4>
            <p className="sector-breakdown-description">
              Examples of positions associated with the industries included in
              this sector. These are role examples, not separate employment
              percentages.
            </p>
          </div>
          <ul className="sector-breakdown-list">
            {professionalServicePositions.map((item) => (
              <li key={item.service}>
                <span>
                  <strong>{item.service}</strong>
                  {item.positions}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="sector-source-note">
        Source: U.S. Census Bureau, 2020–2024 American Community Survey,
        economic profile DP03 and detailed industry table C24030. Percentages
        represent the civilian employed population age 16 and older. Information
        and Professional services remain separate Census sectors. Position names
        below the chart are explanatory examples of roles commonly associated
        with professional-service industries; they are not Census employment
        counts by occupation.
      </p>
    </section>
  )
}

export default EmploymentSectorChart
