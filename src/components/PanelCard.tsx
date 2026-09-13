import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import CardHeading from 'components/CardHeading'

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
    <CardHeading eyebrow={eyebrow} title={title} icon={Icon} action={action} />
    {children}
  </section>
)

export default PanelCard
