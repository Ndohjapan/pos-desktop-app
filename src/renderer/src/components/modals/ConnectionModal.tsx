import { useEffect, useState } from 'react'
import ConncetionIcon from '@renderer/assets/icons/connection.svg'
import { BsFillHddNetworkFill } from 'react-icons/bs'
import { useConnectionStore, useServiceStore } from '../../store/connection'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { DiscoveredService } from '@renderer/types'

function ConnectionModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}): JSX.Element {
  const [services, setServices] = useState<DiscoveredService[]>([])
  const [componentStatus, setComponentStatus] = useState('searching')
  const setConnectionDetails = useConnectionStore((state) => state.setConnectionDetails)
  const setServiceName = useServiceStore((state) => state.setServiceName)
  const navigate = useNavigate()

  function connect(ip: string, port: number, label: string): void {
    // Connect by IP (never the flaky .local hostname). host holds the IP so all
    // existing `http://${host}:${port}` call sites now target it directly.
    setConnectionDetails(ip, port, ip, 'Others')
    setServiceName(label)
    toast.success('Connected to Main Server')
    onClose()
    navigate('/main')
  }

  function handleConnection(service: DiscoveredService): void {
    connect(service.ip, service.port, service.name)
  }

  useEffect(() => {
    if (componentStatus === 'searching') {
      const searchForDevice = async (): Promise<void> => {
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
          <DeviceFoundState services={services} onSelect={handleConnection} />
        )}

        {/* Manual entry is always available as a fallback when discovery is
            flaky (AP isolation, firewall blocking mDNS, host on another subnet). */}
        {componentStatus !== 'searching' && <ManualConnect onConnect={connect} />}
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
  onSelect
}: {
  services: DiscoveredService[]
  onSelect: (service: DiscoveredService) => void
}): JSX.Element {
  return (
    <div>
      <p className="text-secondary font-bold">{services.length} device(s) found</p>
      <p className="text-secondary text-xs">Select device to connect</p>
      <div className="mt-3 flex flex-col gap-2">
        {services.map((service, index) => (
          <div
            key={index}
            className="p-3 bg-[#F6F6F6] rounded-md flex justify-between items-center cursor-pointer hover:bg-[#EFEFEF]"
            onClick={() => onSelect(service)}
          >
            <div className="flex flex-col gap-1">
              <BsFillHddNetworkFill className="text-secondary text-lg" />
              <h3 className="text-secondary text-sm">{service.name}</h3>
              <span className="text-secondary/60 text-xs">
                {service.ip}:{service.port}
              </span>
            </div>
            <div className="px-2 rounded-md bg-[#F5E6E8]">
              <span className="text-sm font-medium text-[#FD0002]">Not connected</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ManualConnect({
  onConnect
}: {
  onConnect: (ip: string, port: number, label: string) => void
}): JSX.Element {
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('3000')

  const handleManual = (): void => {
    const trimmedIp = ip.trim()
    const parsedPort = parseInt(port, 10)
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmedIp)) {
      toast.error('Enter a valid IP address, e.g. 192.168.0.12')
      return
    }
    if (!parsedPort || parsedPort < 1 || parsedPort > 65535) {
      toast.error('Enter a valid port (usually 3000)')
      return
    }
    onConnect(trimmedIp, parsedPort, `${trimmedIp}:${parsedPort}`)
  }

  return (
    <div className="mt-4 border-t border-[#EEE] pt-3">
      <p className="text-secondary text-xs font-semibold mb-2">
        Or connect manually (ask for the Host device IP shown on its screen)
      </p>
      <div className="flex items-center gap-2">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="192.168.0.12"
          className="flex-1 px-3 py-2 rounded-md border border-[#DCDCDC] text-sm focus:outline-none focus:border-primary-500"
        />
        <input
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="3000"
          className="w-20 px-3 py-2 rounded-md border border-[#DCDCDC] text-sm focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={handleManual}
          className="px-4 py-2 bg-primary-700 text-white text-sm font-bold rounded-md hover:bg-primary-800"
        >
          Connect
        </button>
      </div>
    </div>
  )
}

export default ConnectionModal
