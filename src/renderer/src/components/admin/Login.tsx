'use client'

import { useState } from 'react'
import Logo from '@renderer/assets/images/logo.svg'
import Background from '@renderer/assets/images/background.png'
import { Link, useNavigate } from 'react-router-dom'
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

      localStorage.setItem('pos-admin-token', response.data.id)

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
        <div className="max-w-[520px] w-full p-4 bg-[#F5F5F533] rounded-[36px]">
          <div className="max-w-[500px] w-full p-7 bg-white rounded-[20px] ">
            <div>
              <img src={Logo} alt="Amala Oluyole" width={100} height={100} className="" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Login to your account</h2>
            </div>
            <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="font-medium text-xs text-secondary">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    placeholder="Phone Number"
                    required
                    className="appearance-none text-xs rounded-lg relative block w-full px-3 py-3 border border-[#DCDCDC] placeholder-[#828080] text-[#828080] focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="font-medium text-xs text-secondary">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="appearance-none text-xs rounded-lg relative block w-full p-3 border border-[#DCDCDC] placeholder-[#828080] text-[#828080] focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center p-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-700 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login in'}
                </button>

                <Link
                  to="/admin/signup"
                  className="text-primary-700 text-center text-sm cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
