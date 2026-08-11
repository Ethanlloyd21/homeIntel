import type { CSSProperties } from 'react'

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
        <strong>{score}</strong>
        <small>/ 100</small>
      </div>
    </div>
  )
}
