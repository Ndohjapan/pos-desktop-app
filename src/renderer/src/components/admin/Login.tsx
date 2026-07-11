'use client'

import { useState } from 'react'
import Logo from '@renderer/assets/images/logo.svg'
import Background from '@renderer/assets/images/background.png'
// `Link` removed — the "Create an account" link is disabled (see below).
import { useNavigate } from 'react-router-dom'
import { authApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const phoneNumber = formData.get('phoneNumber') as string
    const password = formData.get('password') as string

    try {
      const baseUrl = `http://${host}:${port}/api`
      const response = await authApi.login(baseUrl, { phoneNumber, password })

      // Store the real session token (was the forgeable admin row id).
      localStorage.setItem('pos-admin-token', response.data.token)

      navigate('/admin/main')
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-primary-700">
      <div
        className="w-full h-full bg-cover bg-no-repeat bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${Background})` }}
      >
        <div className="w-full max-w-[440px] card shadow-elevated p-8">
          <img src={Logo} alt="Amala Oluyole" className="w-20 mb-5" />
          <h2 className="font-bold text-xl text-ink">Login to your account</h2>
          <p className="text-sm text-muted mt-1">Enter your admin details to continue</p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="label">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  placeholder="e.g. 08012345678"
                  required
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="input"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                {isLoading ? 'Logging in…' : 'Login'}
              </button>
              {/* Account creation disabled — admins are provisioned centrally.
              <Link
                to="/admin/signup"
                className="text-primary-700 text-center text-sm font-medium hover:text-primary-800"
              >
                Create an account
              </Link>
              */}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
