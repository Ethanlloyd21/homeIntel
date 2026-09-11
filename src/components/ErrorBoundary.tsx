import { AlertTriangle } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * A render fault anywhere in the tree used to blank the whole page. Show what
 * broke and keep a way back instead.
 */
// Only a class can catch render errors, and the house style bans function
// expressions — so the lifecycle hooks are written as class-property arrows.
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError = (error: Error): State => ({ error })

  componentDidCatch = (error: Error, info: ErrorInfo) => {
    console.error('HomeIntel render error', error, info.componentStack)
  }

  render = () => {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="app-error">
        <div className="card">
          <span>
            <AlertTriangle size={22} aria-hidden="true" />
          </span>
          <h2>Something in this view failed to render</h2>
          <p>
            Your saved household profile and shortlist are untouched. Reload to
            try again, or go back to the city search.
          </p>
          <pre>{error.message}</pre>
          <div className="app-error-actions">
            <button
              type="button"
              className="pill-button"
              onClick={() => window.location.reload()}
            >
              Reload this view
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                window.location.href = '/overview'
              }}
            >
              Back to the overview
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
