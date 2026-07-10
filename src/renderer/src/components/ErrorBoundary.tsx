import { Component, ErrorInfo, ReactNode } from 'react'
import { rollbar } from '@renderer/lib/logging'
import Logo from '@renderer/assets/images/logo.svg'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/**
 * Catches any render/runtime error in the React tree and shows a recoverable
 * screen instead of the previous permanent white screen. Reports to Rollbar so
 * these crashes stop being invisible, and offers a graphics-acceleration
 * fallback for the low-end machines where the GPU is the culprit.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    rollbar.error(error.message, { componentStack: info.componentStack })
    console.error('Render error caught by boundary:', error, info)
  }

  handleReload = (): void => {
    // Clear the error and reload the app fresh.
    window.location.hash = '#/'
    window.location.reload()
  }

  handleDisableGpu = async (): Promise<void> => {
    // Relaunches the app with hardware acceleration off.
    await window.api.setHardwareAcceleration(false)
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="w-full h-screen flex items-center justify-center bg-app p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <img src={Logo} alt="Amala Oluyole" className="mx-auto mb-4 max-w-[140px]" />
          <h1 className="text-lg font-bold text-secondary">Something went wrong</h1>
          <p className="text-sm text-muted mt-2">
            The app hit an unexpected error. Your data is safe. Reload to continue.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-800"
            >
              Reload App
            </button>
            <button
              onClick={this.handleDisableGpu}
              className="w-full py-2 rounded-lg border border-line text-secondary text-sm hover:bg-gray-50"
            >
              Keeps happening? Disable graphics acceleration &amp; restart
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
