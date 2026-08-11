import CircularProgress from '@mui/material/CircularProgress'

export default function LoadingSpinner({
  size = 22,
  label = 'Loading data',
}: {
  size?: number
  label?: string
}) {
  return (
    <span className="loading-spinner" role="status" aria-label={label}>
      <CircularProgress size={size} thickness={4.5} color="inherit" />
    </span>
  )
}
