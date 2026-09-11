import { Home } from 'lucide-react'

const mark = (
  <>
    <div className="brand-mark">
      <Home size={17} strokeWidth={2.4} />
    </div>
    <span>
      home<span>intel</span>
    </span>
  </>
)

/**
 * With `onReset` the brand acts as a "start over" control: it clears the
 * selected cities and returns to the landing search. Without it, it is just
 * the wordmark.
 */
const Brand = ({ onReset }: { onReset?: () => void }) => {
  if (!onReset) return <div className="brand">{mark}</div>

  return (
    <button
      type="button"
      className="brand brand-button"
      onClick={onReset}
      title="Start over — clears the cities you selected"
      aria-label="HomeIntel home. Start over and clear the selected cities."
    >
      {mark}
    </button>
  )
}

export default Brand
