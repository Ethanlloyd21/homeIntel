import { ChevronDown, type LucideIcon } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import AnimatedValue from 'components/AnimatedValue'
import SourceChip from 'components/SourceChip'

const MetricCard = ({
  label,
  value,
  note,
  icon: Icon,
  color,
  trend,
  source,
  help,
  detail,
  sources,
  valueKind = 'number',
}: {
  label: string
  value: ReactNode
  note: ReactNode
  icon: LucideIcon
  color?: string
  trend?: string
  source?: string
  help?: ReactNode
  detail?: ReactNode
  sources?: { label: string; href: string }[]
  valueKind?: 'number' | 'text'
}) => {
  const displayKind =
    typeof value === 'string' && !/\d/.test(value) ? 'text' : valueKind
  return (
    <Collapsible.Root asChild>
      <article
        className="metric-card card"
        style={
          color ? ({ '--metric-accent': color } as CSSProperties) : undefined
        }
      >
        <div className="metric-head">
          <span className="metric-icon">
            <Icon size={18} aria-hidden="true" />
          </span>
          <p>{label}</p>
          {help ??
            (source && (
              <SourceChip
                source={source}
                detail={typeof detail === 'string' ? detail : undefined}
              />
            ))}
        </div>
        <div className={`metric-value metric-value-${displayKind}`}>
          <strong>
            <AnimatedValue value={value} />
          </strong>
        </div>
        <small>
          {trend && (
            <b className={trend.startsWith('+') ? 'up' : 'neutral'}>{trend}</b>
          )}
          {trend && ' '}
          {note}
        </small>
        <Collapsible.Trigger className="housing-detail-trigger">
          <span>
            <span className="metric-details-closed">View details</span>
            <span className="metric-details-open">Hide details</span>
            <span className="sr-only">: {label}</span>
          </span>
          <ChevronDown size={14} aria-hidden="true" />
        </Collapsible.Trigger>
        <Collapsible.Content className="housing-detail-content">
          <div>
            <p>
              {detail ?? (
                <>
                  {trend && `${trend} `}
                  {note}
                </>
              )}
              {source && ` Source: ${source}.`}
            </p>
            {sources && sources.length > 0 && (
              <>
                <span>Sources</span>
                <ul>
                  {sources.map((entry) => (
                    <li key={entry.href}>
                      <a href={entry.href} target="_blank" rel="noreferrer">
                        {entry.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Collapsible.Content>
      </article>
    </Collapsible.Root>
  )
}

export default MetricCard
