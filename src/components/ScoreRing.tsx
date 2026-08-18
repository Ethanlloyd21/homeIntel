import type { CSSProperties } from 'react'
import AnimatedValue from 'components/AnimatedValue'

const ScoreRing = ({ score, color }: { score: number; color: string }) => {
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

export default ScoreRing
