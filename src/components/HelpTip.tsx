import { CircleHelp } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Shared, viewport-safe help for fields, source notes, and confidence badges. */
const HelpTip = ({
  label,
  text,
  badge,
  className = '',
  buttonClassName,
}: {
  label: string
  text: ReactNode
  badge?: ReactNode
  className?: string
  buttonClassName?: string
}) => {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const tooltip = useRef<HTMLSpanElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const [position, setPosition] = useState<{
    left: number
    top: number
    below: boolean
    maxHeight: number
  } | null>(null)
  const cancelClose = () => clearTimeout(closeTimer.current)
  const show = () => {
    cancelClose()
    const rect = button.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(300, window.innerWidth - 32)
    const spaceBelow = window.innerHeight - rect.bottom - 24
    const spaceAbove = rect.top - 24
    const below = spaceAbove < 180 && spaceBelow > spaceAbove
    setPosition({
      left: Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - width / 2,
          window.innerWidth - width - 16,
        ),
      ),
      top: below ? rect.bottom + 8 : rect.top - 8,
      below,
      maxHeight: Math.max(0, Math.min(180, below ? spaceBelow : spaceAbove)),
    })
  }
  const closeSoon = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setPosition(null), 140)
  }

  useEffect(() => {
    if (!position) return
    const dismiss = () => setPosition(null)
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !button.current?.contains(event.target) &&
        !tooltip.current?.contains(event.target)
      )
        dismiss()
    }
    window.addEventListener('resize', dismiss)
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('scroll', outside, true)
    return () => {
      window.removeEventListener('resize', dismiss)
      document.removeEventListener('keydown', escape)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('scroll', outside, true)
    }
  }, [position])
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  return (
    <span
      className={`help-tip ${className}`}
      onMouseEnter={show}
      onMouseLeave={closeSoon}
    >
      <button
        ref={button}
        type="button"
        className={buttonClassName}
        aria-label={label}
        aria-describedby={position ? id : undefined}
        onFocus={show}
        onBlur={closeSoon}
        onClick={show}
      >
        <CircleHelp size={14} aria-hidden="true" />
        {badge}
      </button>
      {position &&
        createPortal(
          <span
            ref={tooltip}
            className="help-tooltip"
            id={id}
            role="tooltip"
            style={{
              left: position.left,
              top: position.top,
              maxHeight: position.maxHeight,
              transform: position.below ? undefined : 'translateY(-100%)',
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={closeSoon}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  )
}

export default HelpTip
