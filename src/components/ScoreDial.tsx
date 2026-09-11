import type { CSSProperties } from 'react'
import AnimatedValue from 'components/AnimatedValue'

const toneColors: Record<string, string> = {
  good: '#287a64',
  caution: '#be8a42',
  alert: '#d65e45',
  neutral: '#2e7da1',
}

const ScoreDial = ({
  score,
  label,
  caption,
  tone = 'neutral',
  size = 132,
}: {
  score: number
  label: string
  caption?: string
  tone?: keyof typeof toneColors
  size?: number
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  return (
    <div
      className="score-dial"
      style={
        {
          '--dial-size': `${size}px`,
          '--dial-angle': `${clamped * 3.6}deg`,
          '--dial-color': toneColors[tone] ?? toneColors.neutral,
        } as CSSProperties
      }
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <div className="score-dial-ring">
        <div className="score-dial-inner">
          <strong>
            <AnimatedValue value={clamped} />
          </strong>
          <small>/100</small>
        </div>
      </div>
      <div className="score-dial-copy">
        <span>{label}</span>
        {caption && <small>{caption}</small>}
      </div>
    </div>
  )
}

export default ScoreDial
