//@ts-nocheck
import { useEffect, useState } from 'react'
import ConncetionIcon from '@renderer/assets/icons/connection.svg'
import { BsFillHddNetworkFill } from 'react-icons/bs'
import { useConnectionStore, useServiceStore } from '../../store/connection'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
function ConnectionModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
}): JSX.Element {
  const [services, setServices] = useState(null)
  const [componentStatus, setComponentStatus] = useState('searching')
  const setConnectionDetails = useConnectionStore((state) => state.setConnectionDetails)
  const setServiceName = useServiceStore((state) => state.setServiceName)
  const navigate = useNavigate()


  function handleConnection(service) {
    console.log(service);
    setConnectionDetails(service.ip, service.port, service.host, 'Others')
    setServiceName(service.name);
    toast.success('Connected to Main Server')
    onClose()
    navigate('/main')
  }


  useEffect(() => {
    if (componentStatus === 'searching') {
      const searchForDevice = async () => {
        const result = await window.api.searchForService()
        if (result.found) {
          setServices(result.services)
          setComponentStatus('device_found')
        } else {
          setComponentStatus('not_found')
        }
      }
      searchForDevice()
    }
  }, [componentStatus])




  if (!isOpen) return <></>

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#000]/50">
      <div className="bg-white rounded-2xl p-6 w-full md:min-w-[400px] max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <img src={ConncetionIcon} alt="Connection Icon" className="" />
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>

        {componentStatus === 'searching' && <SearchingState />}
        {componentStatus === 'not_found' && (
          <NotFoundState onRetry={() => setComponentStatus('searching')} />
        )}
        {componentStatus === 'device_found' && (
          <DeviceFoundState connected={false} services={services} onSelect={handleConnection} />
        )}
      </div>
    </div>
  )
}

function SearchingState(): JSX.Element {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''))
    }, 500)
    return (): void => clearInterval(interval)
  }, [])

  return <p className="text-secondary font-bold">Searching for main device{dots}</p>
}

function NotFoundState({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <p className="text-secondary font-bold">Unable to locate main device</p>
      <button onClick={onRetry} className="text-red-500 font-medium hover:underline cursor-pointer">
        &#x21bb; Retry
      </button>
    </div>
  )
}

function DeviceFoundState({
  services,
  connected,
  onSelect
}: {
  services: any[]
  connected: boolean
  onSelect: () => void
}): JSX.Element {
  return (
    <div>
      <p className="text-secondary font-bold">{services.length} devices found</p>
      <p className="text-secondary text-xs">Select device to connect</p>
      <div className="mt-3 flex flex-col gap-2">
        {services.map((service, index) => (
          <div
            key={index}
            className="p-3 bg-[#F6F6F6] rounded-md flex justify-between items-center cursor-pointer hover:bg-[#EFEFEF]"
            onClick={() => { onSelect(service) }}
          >
            <div className="flex flex-col gap-2">
              <BsFillHddNetworkFill className="text-secondary text-lg" />
              <h3 className="text-secondary text-lg">{service.name}</h3>
            </div>
            <div className={`px-2 rounded-md ${connected ? 'bg-[#DDFFFC]' : 'bg-[#F5E6E8]'}`}>
              <span
                className={`text-sm font-medium ${connected ? 'text-[#01A920]' : 'text-[#FD0002]'}`}
              >
                {connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConnectionModal
