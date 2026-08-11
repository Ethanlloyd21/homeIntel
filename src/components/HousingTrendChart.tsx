import { useId, useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { HousingData, MarketPoint } from '../services/housing'

type Metric = 'homeValue' | 'rent'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function monthLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function chartGeometry(series: MarketPoint[]) {
  const width = 760
  const height = 250
  const top = 22
  const bottom = 35
  const values = series.map(({ value }) => value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const padding = Math.max((rawMax - rawMin) * 0.18, rawMax * 0.02, 1)
  const min = rawMin - padding
  const max = rawMax + padding
  const range = max - min
  const usableHeight = height - top - bottom
  const points = series.map(({ value }, index) => ({
    x: series.length === 1 ? width / 2 : (index / (series.length - 1)) * width,
    y: top + ((max - value) / range) * usableHeight,
  }))
  const line = points.map(({ x, y }) => `${x},${y}`).join(' ')
  const area = `M ${points[0].x} ${height - bottom} L ${points
    .map(({ x, y }) => `${x} ${y}`)
    .join(' L ')} L ${points.at(-1)?.x ?? width} ${height - bottom} Z`
  return { width, height, top, bottom, min, max, points, line, area }
}

export default function HousingTrendChart({
  housing,
  color,
}: {
  housing: HousingData
  color: string
}) {
  const [metric, setMetric] = useState<Metric>('homeValue')
  const gradientId = useId().replaceAll(':', '')
  const series =
    metric === 'homeValue' ? housing.homeValueHistory : housing.rentHistory
  const geometry = useMemo(
    () => (series.length >= 2 ? chartGeometry(series) : null),
    [series],
  )

  if (!geometry) {
    return (
      <section className="card wide-chart housing-trend-empty">
        <div className="section-heading">
          <div>
            <small>ZILLOW MARKET HISTORY</small>
            <h3>Housing market trend</h3>
          </div>
        </div>
        <p>Historical Zillow data is not available for this city.</p>
      </section>
    )
  }

  const first = series[0].value
  const latest = series.at(-1)?.value ?? first
  const change = ((latest - first) / first) * 100
  const positive = change >= 0
  const TrendIcon = positive ? TrendingUp : TrendingDown

  return (
    <section className="card wide-chart housing-trend-chart">
      <div className="section-heading housing-chart-heading">
        <div>
          <small>ZILLOW MARKET HISTORY</small>
          <h3>
            {metric === 'homeValue'
              ? 'Typical home value'
              : 'Typical market rent'}
          </h3>
        </div>
        <div className="housing-chart-toggle" aria-label="Housing chart metric">
          <button
            className={metric === 'homeValue' ? 'active' : ''}
            onClick={() => setMetric('homeValue')}
          >
            Home value
          </button>
          <button
            className={metric === 'rent' ? 'active' : ''}
            onClick={() => setMetric('rent')}
          >
            Rent
          </button>
        </div>
      </div>

      <div className="housing-chart-summary">
        <strong>{currency.format(latest)}</strong>
        <span className={positive ? 'positive' : 'negative'}>
          <TrendIcon size={15} /> {Math.abs(change).toFixed(1)}%
        </span>
        <small>since {monthLabel(series[0].date)}</small>
      </div>

      <div className="housing-chart-plot">
        <div className="housing-y-axis">
          <span>{compactCurrency.format(geometry.max)}</span>
          <span>
            {compactCurrency.format((geometry.max + geometry.min) / 2)}
          </span>
          <span>{compactCurrency.format(geometry.min)}</span>
        </div>
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          role="img"
          aria-label={`${metric === 'homeValue' ? 'Home value' : 'Rent'} history from ${monthLabel(series[0].date)} to ${monthLabel(series.at(-1)?.date ?? series[0].date)}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".3" />
              <stop offset="1" stopColor={color} stopOpacity=".02" />
            </linearGradient>
          </defs>
          {[
            geometry.top,
            (geometry.height - geometry.bottom + geometry.top) / 2,
            geometry.height - geometry.bottom,
          ].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2={geometry.width}
              y2={y}
              className="housing-grid-line"
            />
          ))}
          <path d={geometry.area} fill={`url(#${gradientId})`} />
          <polyline
            points={geometry.line}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {geometry.points.map((point, index) => (
            <circle
              key={series[index].date}
              cx={point.x}
              cy={point.y}
              r={index === geometry.points.length - 1 ? 6 : 3}
              fill="#fff"
              stroke={color}
              strokeWidth={index === geometry.points.length - 1 ? 4 : 2}
            >
              <title>
                {monthLabel(series[index].date)}:{' '}
                {currency.format(series[index].value)}
              </title>
            </circle>
          ))}
        </svg>
        <div className="housing-x-axis">
          {series.map((point, index) =>
            index % 3 === 0 || index === series.length - 1 ? (
              <span key={point.date}>{monthLabel(point.date)}</span>
            ) : null,
          )}
        </div>
      </div>
      <p className="housing-chart-source">
        ZHVI and ZORI · Zillow Research · Quarterly points from monthly releases
      </p>
    </section>
  )
}
