import { ChevronDown, Home } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import type { ReactNode } from 'react'
import AnimatedValue from 'components/AnimatedValue'
import MiniTrend from 'components/MiniTrend'

const MetricCard = ({
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
}) => {
  return (
    <Collapsible.Root asChild>
      <article className="metric-card card group relative transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl focus-within:ring-2 focus-within:ring-violet-400/50">
        <div className="metric-head">
          <span style={{ background: `${color}14`, color }}>
            <Icon size={18} aria-hidden="true" />
          </span>
          <p>{label}</p>
        </div>
        <div className="metric-value">
          <strong>
            <AnimatedValue value={value} />
          </strong>
          <MiniTrend color={color} invert={trend?.startsWith('-')} />
        </div>
        <small>
          {trend && (
            <b className={trend.startsWith('+') ? 'up' : 'neutral'}>{trend}</b>
          )}{' '}
          {note}
        </small>
        <Collapsible.Trigger className="mt-3 flex w-full items-center justify-between rounded-lg border-0 bg-transparent px-0 py-1 text-[11px] font-semibold text-slate-500 outline-none transition-colors hover:text-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400/60">
          <span>View details</span>
          <ChevronDown
            size={14}
            className="transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapse-up_180ms_ease-out] data-[state=open]:animate-[collapse-down_180ms_ease-out]">
          <div className="mt-2 border-t border-slate-200/70 pt-3 text-xs leading-relaxed text-slate-500">
            <p className="m-0">
              {trend ? `${trend} ${note}` : note}
              {source ? ` Source: ${source}.` : ''}
            </p>
          </div>
        </Collapsible.Content>
      </article>
    </Collapsible.Root>
  )
}

export default MetricCard
