import { AiOutlineUser } from 'react-icons/ai'
import { IoLogOut } from 'react-icons/io5'
import Logo from '@renderer/assets/images/logo.svg'
import { useServiceStore } from '@renderer/store/connection'
import { useConnectionStore, useSectionStore } from '@renderer/store/connection'
import { useNavigate } from 'react-router-dom'
import ConnectionStatus from './ConnectionStatus'
import CashierBadge from './pos/CashierBadge'
import { authApi } from '@renderer/api/client'
import { getAdminToken } from '@renderer/utils/auth'

function Nav() {
  const navigate = useNavigate()
  const connectionType = useConnectionStore((state) => state.type)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const serviceName = useServiceStore((state) => state.serviceName)
  const setSectionName = useSectionStore((state) => state.setSectionName)
  const clearSectionName = useSectionStore((state) => state.clearSectionName)
  const sectionName = useSectionStore((state) => state.sectionName)
  const clearServiceName = useServiceStore((state) => state.clearServiceName)
  const clearConnectionDetails = useConnectionStore((state) => state.clearConnectionDetails)

  const handleLogout = async () => {
    // Invalidate the session server-side before clearing local state.
    const token = getAdminToken()
    if (token) {
      await authApi.logout(`http://${host}:${port}/api`, token)
    }

    clearServiceName()
    clearConnectionDetails()
    clearSectionName()
    localStorage.removeItem('pos-admin-token')

    // Stop server if running as main
    if (connectionType === 'Main') {
      await window.api.stopServer()
    }

    // Navigate to home
    navigate('/')
  }

  const getOppositeSection = () => {
    return sectionName === 'User' ? 'Admin' : 'User'
  }

  const changeSection = () => {
    const alternateSection = getOppositeSection()
    localStorage.removeItem('pos-admin-token')

    if (alternateSection === 'User') {
      setSectionName('User')
      navigate('/main')
    } else {
      setSectionName('Admin')
      navigate('/admin/login')
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 backdrop-blur border-b border-line">
      <div className="w-full 2xl:max-w-[2000px] 2xl:mx-auto flex justify-between items-center h-16 px-6 md:px-10">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <img src={Logo} alt="Amala Oluyole" className="h-9 w-auto" />
        </div>

        {/* Centre: device name + live connection */}
        <div className="hidden md:flex flex-col items-center leading-tight">
          {serviceName && <div className="text-sm font-semibold text-ink truncate max-w-[280px]">{serviceName}</div>}
          <ConnectionStatus />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <CashierBadge />

          <button
            onClick={changeSection}
            className="flex items-center gap-1.5 rounded-control border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-app transition-colors"
          >
            <AiOutlineUser className="text-base text-muted" />
            <span>{getOppositeSection()}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-control border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-danger-50 hover:border-danger-100 hover:text-danger-600 transition-colors"
          >
            Logout
            <IoLogOut className="text-base" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Nav
