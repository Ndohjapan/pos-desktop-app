import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import Nav from '@renderer/components/Nav'
import Main from './components/Main'

const AppRouter = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/main"
        element={
          <>
            <Nav />
            <Main />
          </>
        }
      />{' '}
    </Routes>
  )
}

export default AppRouter
