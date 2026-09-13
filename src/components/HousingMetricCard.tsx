import {
  BadgeDollarSign,
  Database,
  House,
  KeyRound,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import MetricCard from 'components/MetricCard'

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

const HousingMetricCard = ({
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
}) => {
  const MetricIcon = icon ?? metricIcons[label] ?? House

  return (
    <MetricCard
      label={label}
      value={value}
      note={note}
      detail={detail}
      sources={sources}
      color={color}
      icon={MetricIcon}
      valueKind={label === 'Data source' ? 'text' : 'number'}
    />
  )
}

export default HousingMetricCard
