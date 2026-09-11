import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const PanelCard = ({
  eyebrow,
  title,
  icon: Icon,
  action,
  children,
  className = '',
  id,
  accent,
}: {
  eyebrow?: string
  title: ReactNode
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
  id?: string
  accent?: string
}) => (
  <section
    className={`card panel-card ${className}`}
    id={id}
    style={
      accent ? ({ '--panel-accent': accent } as React.CSSProperties) : undefined
    }
  >
    <div className="panel-card-heading">
      {Icon && (
        <span className="panel-card-icon">
          <Icon size={18} aria-hidden="true" />
        </span>
      )}
      <div>
        {eyebrow && <small>{eyebrow}</small>}
        <h3>{title}</h3>
      </div>
      {action && <div className="panel-card-action">{action}</div>}
    </div>
    {children}
  </section>
)

export default PanelCard
