import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import Nav from '@renderer/components/Nav'
import Main from './components/Main'
import AdminMain from './components/admin/Main'
import Login from './components/admin/Login'
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
