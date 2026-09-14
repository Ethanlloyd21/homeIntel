import { type LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import AnimatedValue from 'components/AnimatedValue'
import HelpTip from 'components/HelpTip'

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
  const hasDetails = Boolean(detail || source || sources?.length)

  return (
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
          (hasDetails && (
            <HelpTip
              label={`Details for ${label}`}
              text={
                <span className="metric-help-content">
                  {(source || detail) && (
                    <span>
                      {source && <strong>{source}</strong>}
                      {source && detail && ' '}
                      {detail}
                    </span>
                  )}
                  {sources && sources.length > 0 && (
                    <span className="metric-help-sources">
                      <strong>Sources</strong>
                      {sources.map((entry) => (
                        <a
                          key={entry.href}
                          href={entry.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {entry.label}
                        </a>
                      ))}
                    </span>
                  )}
                </span>
              }
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
    </article>
  )
}

export default MetricCard
