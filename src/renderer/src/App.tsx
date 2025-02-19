import { ToastProvider } from './providers/ToastProvider'
import AppRouter from './router'
import { HashRouter } from 'react-router-dom'

function App(): JSX.Element {
  return (
    <>
      <HashRouter>
        <AppRouter />
        <ToastProvider />
      </HashRouter>
    </>
  )
}

export default App
