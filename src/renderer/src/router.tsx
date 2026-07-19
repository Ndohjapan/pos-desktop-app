import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import Nav from '@renderer/components/Nav'
import Main from './components/Main'
import AdminMain from './components/admin/Main'
import Login from './components/admin/Login'
// Signup is first-run-only: the page refuses to create an account once any
// admin exists on the machine (staff can't self-provision admin access), but a
// brand-new till must be able to create its owner account.
import SignUp from './components/admin/SignUp'

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
      <Route
        path="/admin/login"
        element={
          <>
            <Nav />
            <Login />
          </>
        }
      />{' '}
      <Route
        path="/admin/signup"
        element={
          <>
            <Nav />
            <SignUp />
          </>
        }
      />{' '}
      <Route
        path="/admin/main"
        element={
          <>
            <Nav />
            <AdminMain />
          </>
        }
      />{' '}
    </Routes>
  )
}

export default AppRouter
