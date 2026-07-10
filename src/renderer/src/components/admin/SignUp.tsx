import { useState } from 'react'
import Logo from '@renderer/assets/images/logo.svg'
import Background from '@renderer/assets/images/background.png'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import toast from 'react-hot-toast'

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const fullName = (formData.get('fullname') as string)?.trim()
    const phoneNumber = (formData.get('phoneNumber') as string)?.trim()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    // Validate before hitting the server so bad input (e.g. a phone of "stance")
    // is caught immediately with a clear message.
    if (!fullName) {
      setIsLoading(false)
      toast.error('Enter your full name')
      return
    }
    if (!/^0\d{10}$/.test(phoneNumber)) {
      setIsLoading(false)
      toast.error('Enter a valid 11-digit phone number (e.g. 08012345678)')
      return
    }
    if (!password || password.length < 6) {
      setIsLoading(false)
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setIsLoading(false)
      toast.error('Password and confirm password do not match')
      return
    }

    try {
      const baseUrl = `http://${host}:${port}/api`
      await authApi.signup(baseUrl, { fullName, phoneNumber, password })
      toast.success('Admin created successfully')
      navigate('/admin/login')
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
        <div className="w-full max-w-[460px] card shadow-elevated p-8">
          <img src={Logo} alt="Amala Oluyole" className="w-20 mb-5" />
          <h2 className="font-bold text-xl text-ink">Create an admin account</h2>
          <p className="text-sm text-muted mt-1">The first account becomes the owner</p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fullname" className="label">
                    Full Name
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    placeholder="Full name"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="label">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    placeholder="08012345678"
                    required
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="confirm_password" className="label">
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  className="input"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                {isLoading ? 'Creating account…' : 'Create Account'}
              </button>
              <Link
                to="/admin/login"
                className="text-primary-700 text-center text-sm font-medium hover:text-primary-800"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
