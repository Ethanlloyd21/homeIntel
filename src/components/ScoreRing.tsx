import type { CSSProperties } from 'react'
import AnimatedValue from './AnimatedValue'

export default function ScoreRing({
  score,
  color,
}: {
  score: number
  color: string
}) {
  return (
    <div
      className="score-ring"
      style={
        {
          '--score': `${score * 3.6}deg`,
          '--ring': color,
        } as CSSProperties
      }
    >
      <div>
        <strong>
          <AnimatedValue value={score} />
        </strong>
        <small>/ 100</small>
      </div>
    </div>
  )
}
