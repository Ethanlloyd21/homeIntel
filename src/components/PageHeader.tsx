import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const PageHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  actions?: ReactNode
}) => (
  <section className="page-header">
    <div className="page-header-copy">
      <p className="eyebrow">
        {Icon && <Icon size={13} aria-hidden="true" />}
        {eyebrow}
      </p>
      <h2>{title}</h2>
      {description && <p className="page-header-description">{description}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </section>
)

export default PageHeader
