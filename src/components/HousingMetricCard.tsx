import {
  BadgeDollarSign,
  ChevronDown,
  Database,
  House,
  KeyRound,
  type LucideIcon,
} from 'lucide-react'
import { Collapsible } from 'radix-ui'
import type { ReactNode } from 'react'
import AnimatedValue from './AnimatedValue'

type SourceLink = {
  label: string
  href: string
}

const metricIcons: Record<string, LucideIcon> = {
  'Median home value': House,
  'Median gross rent': BadgeDollarSign,
  'Owner occupied': KeyRound,
  'Data source': Database,
}

export default function HousingMetricCard({
  label,
  value,
  note,
  detail,
  sources,
  color,
  icon,
}: {
  label: string
  value: ReactNode
  note: ReactNode
  detail: string
  sources: SourceLink[]
  color: string
  icon?: LucideIcon
}) {
  const MetricIcon = icon ?? metricIcons[label] ?? House

  return (
    <Collapsible.Root asChild>
      <article className="card housing-stat-card group">
        <div className="housing-metric-title">
          <span className="housing-metric-icon" style={{ color }}>
            <MetricIcon size={17} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p>{label}</p>
        </div>
        <strong>
          <AnimatedValue value={value} />
        </strong>
        <small>{note}</small>
        <Collapsible.Trigger className="housing-detail-trigger">
          <span>View details</span>
          <ChevronDown size={14} aria-hidden="true" />
        </Collapsible.Trigger>
        <Collapsible.Content className="housing-detail-content">
          <div>
            <p>{detail}</p>
            <span>Sources</span>
            <ul>
              {sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Collapsible.Content>
      </article>
    </Collapsible.Root>
  )
}
