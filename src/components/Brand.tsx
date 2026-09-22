import reloIcon from '/assets/images/reloicon.svg'

const mark = (
  <>
    <div className="brand-mark">
      <img src={reloIcon} alt="" width={31} height={31} />
    </div>
    <span>
      Relo<span>Intel</span>
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
      aria-label="ReloIntel home. Start over and clear the selected cities."
    >
      {mark}
    </button>
  )
}

export default Brand
