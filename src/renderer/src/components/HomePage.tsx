import { CgSpinner } from 'react-icons/cg'
import { FaNetworkWired } from 'react-icons/fa'
import { BsFillHddNetworkFill } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import VerticalLine from '@renderer/assets/images/vector-lines.png'
import Logo from '@renderer/assets/images/logo.svg'
import ConnectionModal from './modals/ConnectionModal'
import { useState } from 'react'
import { useConnectionStore, useServiceStore } from '@renderer/store/connection'
import toast from 'react-hot-toast'

function HomePage(): JSX.Element {
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState(false)
  const [startingServer, setStartingServer] = useState(false)

  const setConnectionDetails = useConnectionStore((state) => state.setConnectionDetails)
  const setHostIp = useConnectionStore((state) => state.setHostIp)
  const setServiceName = useServiceStore((state) => state.setServiceName)

  const handleStartServer = async () => {
    setStartingServer(true)
    const result = await window.api.startServer()
    setStartingServer(false)
    if (result.success && result.port != null && result.serviceName) {
      setConnectionDetails('localhost', result.port, 'localhost', 'Main')
      setHostIp(result.ip ?? '')
      setServiceName(result.serviceName)
      navigate('/main')
    } else {
      console.error('Failed to start server:', result.error)
      toast.error(result.error ?? 'Failed to start server')
    }
  }

  return (
    <>
      <div
        className="w-full h-screen bg-cover bg-no-repeat bg-center py-20 px-6 md:px-24"
        style={{ backgroundImage: `url(${VerticalLine})` }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex flex-col items-center justify-center">
            <img src={Logo} alt="" />
            <h3 className="text-secondary text-lg font-semibold">Select User Type:</h3>
          </div>
          <div className="flex items-center justify-center mt-3 space-x-4">
            <button
              className={`h-full rounded-md shadow-md min-w-[250px] py-8 px-4 flex flex-col gap-4 cursor-pointer  border-b-8 border-primary-700 hover:bg-gray-100 ${startingServer ? 'bg-gray-100' : 'bg-white'}`}
              onClick={handleStartServer}
              disabled={startingServer}
            >
              {startingServer ? (
                <>
                  <div className="h-full w-full flex items-center justify-center">
                    <CgSpinner className="animate-spin text-secondary text-4xl" />
                  </div>
                </>
              ) : (
                <>
                  <BsFillHddNetworkFill className="text-secondary text-2xl" />
                  <h3 className="text-2xl text-secondary">Main</h3>
                </>
              )}
            </button>
            <button
              className="rounded-md shadow-md min-w-[250px] py-8 px-4 flex flex-col gap-4 cursor-pointer bg-white border-b-8 border-[#FD0002] hover:bg-gray-100"
              onClick={() => setOpenModal(true)}
            >
              <FaNetworkWired className="text-secondary text-2xl rotate-180" />
              <h3 className="text-2xl text-secondary">Other</h3>
            </button>
          </div>
        </div>
      </div>

      <ConnectionModal isOpen={openModal} onClose={() => setOpenModal(false)} />
    </>
  )
}

export default HomePage
