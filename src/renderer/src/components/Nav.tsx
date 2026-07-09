import { AiOutlineUser } from 'react-icons/ai'
import { IoLogOut } from 'react-icons/io5'
import Logo from '@renderer/assets/images/logo.svg'
import { useServiceStore } from '@renderer/store/connection'
import { useConnectionStore, useSectionStore } from '@renderer/store/connection'
import { useNavigate } from 'react-router-dom'

function Nav() {
  const navigate = useNavigate()
  const connectionType = useConnectionStore((state) => state.type)
  const serviceName = useServiceStore((state) => state.serviceName)
  const setSectionName = useSectionStore((state) => state.setSectionName)
  const clearSectionName = useSectionStore((state) => state.clearSectionName)
  const sectionName = useSectionStore((state) => state.sectionName)
  const clearServiceName = useServiceStore((state) => state.clearServiceName)
  const clearConnectionDetails = useConnectionStore((state) => state.clearConnectionDetails)

  const handleLogout = async () => {
    // Clear service name and connection details

    clearServiceName()
    clearConnectionDetails()
    clearSectionName()
    localStorage.removeItem('pos-admin-token')

    console.log(connectionType)

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
    <>
      <div className="w-full 2xl:max-w-[2000px] 2xl:m-auto flex justify-between items-center py-1 px-8 md:px-24 shadow-md ">
        <div>
          <img src={Logo} alt="Amala Oluyole" className="max-w-[30%]" />
        </div>

        <div className="text-lg font-semibold text-secondary">{serviceName}</div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="bg-[#F5F5F5] border border-[#DCDCDC] text-secondary px-4 py-1 rounded-lg focus:outline-none focus:ring-secondary focus:border-secondary cursor-pointer"
          >
            Logout
            <IoLogOut className="inline-block text-lg ml-2 text-[#FD0002]" />
          </button>

          <button
            className="flex items-center rounded-full p-2 bg-[#F5F5F5] border-[#DCDCDC] border border-secondary focus:outline-none focus:ring-secondary focus:border-secondary cursor-pointer h-10"
            onClick={changeSection}
          >
            <AiOutlineUser className="text-secondary text-xl" />
            <span className="text-xs text-secondary font-bold">{getOppositeSection()}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Nav
