import { CgSpinner } from 'react-icons/cg'
import { FaNetworkWired } from 'react-icons/fa'
import { BsFillHddNetworkFill } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
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
      <div className="relative w-full h-screen overflow-hidden bg-app">
        {/* Soft brand glow backdrop */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary-100/60 blur-3xl" />

        <div className="relative flex flex-col items-center justify-center h-full px-6">
          <div className="flex flex-col items-center text-center mb-10">
            <img src={Logo} alt="Amala Oluyole" className="w-28 mb-6" />
            <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
            <p className="text-sm text-muted mt-1">How is this computer being used today?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
            {/* Main */}
            <button
              onClick={handleStartServer}
              disabled={startingServer}
              className="group card p-7 text-left transition-all hover:shadow-elevated hover:-translate-y-0.5 focus:outline-none focus:shadow-focus disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-700 mb-5">
                {startingServer ? (
                  <CgSpinner className="animate-spin text-3xl" />
                ) : (
                  <BsFillHddNetworkFill className="text-2xl" />
                )}
              </div>
              <h3 className="text-lg font-bold text-ink">Main computer</h3>
              <p className="text-sm text-muted mt-1">
                {startingServer
                  ? 'Starting the server…'
                  : 'This is the primary till that stores the data and runs the server.'}
              </p>
            </button>

            {/* Other */}
            <button
              onClick={() => setOpenModal(true)}
              className="group card p-7 text-left transition-all hover:shadow-elevated hover:-translate-y-0.5 focus:outline-none focus:shadow-focus"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-app text-secondary mb-5">
                <FaNetworkWired className="text-2xl rotate-180" />
              </div>
              <h3 className="text-lg font-bold text-ink">Others</h3>
              <p className="text-sm text-muted mt-1">
                Connect this computer to the main one over the network.
              </p>
            </button>
          </div>
        </div>
      </div>

      <ConnectionModal isOpen={openModal} onClose={() => setOpenModal(false)} />
    </>
  )
}

export default HomePage
