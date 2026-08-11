export default function MiniTrend({
  color = '#d65e45',
  invert = false,
}: {
  color?: string
  invert?: boolean
}) {
  const points = invert
    ? '0,5 22,12 43,9 65,20 87,16 110,27'
    : '0,23 22,19 43,21 65,12 87,15 110,5'
  return (
    <svg className="mini-trend" viewBox="0 0 110 30" aria-hidden="true">
      <path d={`${points} L110,30 L0,30 Z`} fill={`${color}16`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.3" />
    </svg>
  )
}
