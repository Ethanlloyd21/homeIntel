import HelpTip from 'components/HelpTip'

/**
 * Every derived number in ReloIntel carries its provenance. This is the one
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
  return (
    <HelpTip
      className={`source-chip ${level ? `source-chip-${level.toLowerCase()}` : ''}`}
      label={`Source: ${source}`}
      badge={level}
      text={
        <>
          <strong>{source}</strong>
          {detail ? <> {detail}</> : null}
        </>
      }
    />
  )
}

export default SourceChip
