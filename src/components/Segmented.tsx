type SegmentedOption<T extends string> = {
  value: T
  label: string
  hint?: string
}

const Segmented = <T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}) => (
  <div className="segmented" role="tablist" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="tab"
        aria-selected={option.value === value}
        className={option.value === value ? 'active' : ''}
        onClick={() => onChange(option.value)}
      >
        <span>{option.label}</span>
        {option.hint && <small>{option.hint}</small>}
      </button>
    ))}
  </div>
)

export default Segmented
