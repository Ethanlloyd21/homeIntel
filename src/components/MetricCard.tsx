import { Home } from 'lucide-react'
import type { ReactNode } from 'react'
import MiniTrend from './MiniTrend'

export default function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  color,
  trend,
  source,
}: {
  label: string
  value: ReactNode
  note: string
  icon: typeof Home
  color: string
  trend?: string
  source?: string
}) {
  return (
    <article className="metric-card card">
      <div className="metric-head">
        <span style={{ background: `${color}14`, color }}>
          <Icon size={18} />
        </span>
      </div>
      <p>{label}</p>
      <div className="metric-value">
        <strong>{value}</strong>
        <MiniTrend color={color} invert={trend?.startsWith('-')} />
      </div>
      <small>
        {trend && (
          <b className={trend.startsWith('+') ? 'up' : 'neutral'}>{trend}</b>
        )}{' '}
        {note}
      </small>
      {source && <small className="metric-source">{source}</small>}
    </article>
  )
}
