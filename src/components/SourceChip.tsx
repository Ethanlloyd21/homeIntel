import { Info } from 'lucide-react'
import { useId } from 'react'

/**
 * Every derived number in HomeIntel carries its provenance. This is the one
 * place that renders it, so the wording stays identical across pages.
 */
const SourceChip = ({
  source,
  detail,
  level,
}: {
  source: string
  detail?: string
  level?: 'High' | 'Medium' | 'Estimated' | 'Loading' | 'Unavailable'
}) => {
  const id = useId()
  return (
    <span
      className={`source-chip ${level ? `source-chip-${level.toLowerCase()}` : ''}`}
    >
      <button
        type="button"
        aria-describedby={id}
        aria-label={`Source: ${source}`}
      >
        <Info size={11} aria-hidden="true" />
        {/* Without a confidence level the icon carries it on its own: a page
            where every statement shouts "SOURCE" is noise, not provenance. */}
        {level}
      </button>
      <span className="sim-tooltip" id={id} role="tooltip">
        <strong>{source}</strong>
        {detail ? <> {detail}</> : null}
      </span>
    </span>
  )
}

export default SourceChip
