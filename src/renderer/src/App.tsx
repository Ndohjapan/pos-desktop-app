import { ToastProvider } from './providers/ToastProvider'
import AppRouter from './router'
import { HashRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import './lib/logging'

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRouter />
        <ToastProvider />
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
