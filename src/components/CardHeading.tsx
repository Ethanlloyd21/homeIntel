import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Shared heading for informational panels and editable sections. */
const CardHeading = ({
  eyebrow,
  title,
  icon: Icon,
  action,
}: {
  eyebrow?: string
  title: ReactNode
  icon?: LucideIcon
  action?: ReactNode
}) => (
  <div className="panel-card-heading">
    {Icon && (
      <span className="panel-card-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
    )}
    <div className="panel-card-heading-copy">
      {eyebrow && <small>{eyebrow}</small>}
      <h3>{title}</h3>
    </div>
    {action && <div className="panel-card-action">{action}</div>}
  </div>
)

export default CardHeading
