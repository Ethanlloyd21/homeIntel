import { useEffect, useMemo, useState, type ReactNode } from 'react'

const numberPattern = /-?\d[\d,]*(?:\.\d+)?/

export default function AnimatedValue({
  value,
  duration = 2400,
}: {
  value: ReactNode
  duration?: number
}) {
  const text = typeof value === 'number' ? String(value) : value
  const parsed = useMemo(() => {
    if (typeof text !== 'string') return null
    const match = text.match(numberPattern)
    if (!match || match.index === undefined) return null
    const raw = match[0]
    const target = Number(raw.replaceAll(',', ''))
    if (!Number.isFinite(target)) return null
    const decimalPlaces = raw.includes('.') ? raw.split('.')[1].length : 0
    return {
      target,
      prefix: text.slice(0, match.index),
      suffix: text.slice(match.index + raw.length),
      decimalPlaces,
      grouped: raw.includes(','),
    }
  }, [text])
  const [displayed, setDisplayed] = useState(parsed ? 0 : null)

  useEffect(() => {
    if (!parsed) return
    let frame = 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame = requestAnimationFrame(() => setDisplayed(parsed.target))
      return () => cancelAnimationFrame(frame)
    }

    const startedAt = performance.now()
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(parsed.target * eased)
      if (progress < 1) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [duration, parsed])

  if (!parsed || displayed === null) return <>{value}</>
  const formatted = displayed.toLocaleString('en-US', {
    useGrouping: parsed.grouped,
    minimumFractionDigits: parsed.decimalPlaces,
    maximumFractionDigits: parsed.decimalPlaces,
  })

  return (
    <span className="animated-value" aria-label={String(text)}>
      {parsed.prefix}
      {formatted}
      {parsed.suffix}
    </span>
  )
}
