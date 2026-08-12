import { Check } from 'lucide-react'
import type { City } from '../data/cities'
import { compact, money } from '../utils/formatters'
import CitySelect from '../components/CitySelect'

export default function ComparePage({
  left,
  right,
  setLeft,
  setRight,
}: {
  left: City
  right: City
  setLeft: (c: City) => void
  setRight: (c: City) => void
}) {
  const metrics = [
    {
      label: 'Median home value',
      a: left.home,
      b: right.home,
      render: money,
      better: 'low',
    },
    {
      label: 'Median household income',
      a: left.income,
      b: right.income,
      render: money,
      better: 'high',
    },
    {
      label: 'Population',
      a: left.population,
      b: right.population,
      render: compact,
      better: 'high',
    },
    {
      label: 'Employment rate',
      a: left.employed,
      b: right.employed,
      render: (v: number) => `${v}%`,
      better: 'high',
    },
    {
      label: 'Risk score',
      a: left.risk,
      b: right.risk,
      render: (v: number) => `${v} / 100`,
      better: 'low',
    },
  ]
  return (
    <div className="compare-page">
      <div className="compare-title">
        <p className="eyebrow">SIDE-BY-SIDE ANALYSIS</p>
        <h2>Compare locations</h2>
        <span>
          See the tradeoffs clearly across cost, opportunity, growth and
          resilience.
        </span>
      </div>
      <div className="compare-selectors">
        <CitySelect value={left} onChange={setLeft} />
        <div className="vs">VS</div>
        <CitySelect value={right} onChange={setRight} />
      </div>
      <section className="comparison-hero card">
        <div className="compare-city">
          <span style={{ color: left.color }}>{left.name}</span>
          <strong>{money(left.home)}</strong>
          <small>Median home value</small>
        </div>
        <div className="comparison-bars">
          <div
            className="comparison-bar-enter"
            style={{
              height: `${Math.max(28, (left.home / Math.max(left.home, right.home)) * 100)}%`,
              background: left.color,
            }}
          />
          <div
            className="comparison-bar-enter"
            style={{
              height: `${Math.max(28, (right.home / Math.max(left.home, right.home)) * 100)}%`,
              background: right.color,
            }}
          />
        </div>
        <div className="compare-city right">
          <span style={{ color: right.color }}>{right.name}</span>
          <strong>{money(right.home)}</strong>
          <small>Median home value</small>
        </div>
      </section>
      <div className="comparison-grid">
        <section className="card comparison-table">
          <div className="section-heading">
            <div>
              <small>CORE METRICS</small>
              <h3>Head-to-head</h3>
            </div>
            <span>Latest available</span>
          </div>
          {metrics.map((m) => {
            const aWin = m.better === 'high' ? m.a > m.b : m.a < m.b
            return (
              <div className="comparison-row" key={m.label}>
                <strong className={aWin ? 'winner' : ''}>
                  {m.render(m.a)}
                  {aWin && <Check size={12} />}
                </strong>
                <span>{m.label}</span>
                <strong className={!aWin ? 'winner' : ''}>
                  {m.render(m.b)}
                  {!aWin && <Check size={12} />}
                </strong>
              </div>
            )
          })}
        </section>
        <section className="card radar-card">
          <div className="section-heading">
            <div>
              <small>CITY FIT</small>
              <h3>Strength profile</h3>
            </div>
          </div>
          <svg className="radar" viewBox="0 0 300 230">
            <g transform="translate(150 112)">
              {[1, 0.75, 0.5, 0.25].map((n) => (
                <polygon
                  key={n}
                  points={`0,${-88 * n} ${84 * n},${-27 * n} ${52 * n},${72 * n} ${-52 * n},${72 * n} ${-84 * n},${-27 * n}`}
                  fill="none"
                  stroke="#dbe1df"
                />
              ))}
              {[
                'Affordability',
                'Income',
                'Growth',
                'Weather',
                'Resilience',
              ].map((t, i) => {
                const a = -Math.PI / 2 + (i * Math.PI * 2) / 5
                return (
                  <text
                    key={t}
                    x={Math.cos(a) * 112}
                    y={Math.sin(a) * 103}
                    textAnchor="middle"
                    className="radar-label"
                  >
                    {t}
                  </text>
                )
              })}
              <polygon
                className="radar-shape-enter"
                points="0,-45 58,-19 29,40 -37,51 -67,-22"
                fill={`${left.color}24`}
                stroke={left.color}
                strokeWidth="2"
              />
              <polygon
                className="radar-shape-enter radar-shape-delay"
                points="0,-70 43,-14 44,61 -28,39 -50,-16"
                fill={`${right.color}1f`}
                stroke={right.color}
                strokeWidth="2"
              />
            </g>
          </svg>
          <div className="legend">
            <span>
              <i style={{ background: left.color }} />
              {left.name}
            </span>
            <span>
              <i style={{ background: right.color }} />
              {right.name}
            </span>
          </div>
        </section>
        <section className="card climate-card">
          <div className="section-heading">
            <div>
              <small>CLIMATE</small>
              <h3>Typical monthly highs</h3>
            </div>
          </div>
          <div className="climate-chart">
            <div className="y-labels">
              <span>100Ã‚Â°</span>
              <span>75Ã‚Â°</span>
              <span>50Ã‚Â°</span>
              <span>25Ã‚Â°</span>
            </div>
            <svg viewBox="0 0 500 170" preserveAspectRatio="none">
              <g className="grid-lines">
                <line x1="0" y1="15" x2="500" y2="15" />
                <line x1="0" y1="60" x2="500" y2="60" />
                <line x1="0" y1="105" x2="500" y2="105" />
                <line x1="0" y1="150" x2="500" y2="150" />
              </g>
              <polyline
                className="chart-line-enter"
                points="0,78 45,76 91,71 136,63 182,56 227,48 273,43 318,45 364,51 409,59 455,69 500,76"
                fill="none"
                stroke={left.color}
                strokeWidth="3"
              />
              <polyline
                className="chart-line-enter chart-line-delay"
                points="0,106 45,93 91,72 136,51 182,34 227,20 273,17 318,22 364,37 409,57 455,80 500,99"
                fill="none"
                stroke={right.color}
                strokeWidth="3"
              />
            </svg>
            <div className="months">
              <span>Jan</span>
              <span>Mar</span>
              <span>May</span>
              <span>Jul</span>
              <span>Sep</span>
              <span>Nov</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
