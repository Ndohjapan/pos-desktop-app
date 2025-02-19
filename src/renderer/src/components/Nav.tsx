//@ts-nocheck
import { IoLogOut } from 'react-icons/io5'
import Logo from '@renderer/assets/images/logo.svg'
import { useServiceStore } from '@renderer/store/connection'
import { useConnectionStore } from '@renderer/store/connection'
import { useNavigate } from 'react-router-dom'

function Nav() {
  const navigate = useNavigate()
  const connectionType = useConnectionStore((state) => state.type)
  const serviceName = useServiceStore((state) => state.serviceName)
  const clearServiceName = useServiceStore((state) => state.clearServiceName)
  const clearConnectionDetails = useConnectionStore((state) => state.clearConnectionDetails)

  const handleLogout = async () => {
    // Clear service name and connection details

    clearServiceName()
    clearConnectionDetails()

    console.log(connectionType)

    // Stop server if running as main
    if (connectionType === 'Main') {
      await window.api.stopServer()
    }

    // Navigate to home
    navigate('/')
  }

  return (
    <>
      <div className="w-full 2xl:max-w-[2000px] 2xl:m-auto flex justify-between items-center py-1 px-8 md:px-24 shadow-md ">
        <div>
          <img src={Logo} alt="Amala Oluyole" className="max-w-[30%]" />
        </div>

        <div className="text-lg font-semibold text-secondary">{serviceName}</div>

        <div>
          <button
            onClick={handleLogout}
            className="bg-[#F5F5F5] border border-[#DCDCDC] text-secondary px-4 py-1 rounded-lg focus:outline-none focus:ring-secondary focus:border-secondary cursor-pointer"
          >
            Logout
            <IoLogOut className="inline-block text-lg ml-2 text-[#FD0002]" />
          </button>
        </div>
      </div>
    </>
  )
}

export default Nav
