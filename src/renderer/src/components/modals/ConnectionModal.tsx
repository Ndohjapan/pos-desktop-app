import { useEffect, useState } from 'react'
import ConncetionIcon from '@renderer/assets/icons/connection.svg'
import { BsFillHddNetworkFill } from 'react-icons/bs'
import { CgSpinner } from 'react-icons/cg'
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
    <div className="overlay">
      <div className="card w-full max-w-md p-6 shadow-elevated">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50">
              <img src={ConncetionIcon} alt="" className="w-5" />
            </div>
            <h2 className="text-base font-bold text-ink">Connect to main device</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:bg-app hover:text-ink transition-colors text-xl"
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

  return (
    <div className="flex items-center gap-3 py-2">
      <CgSpinner className="animate-spin text-primary-700 text-xl" />
      <p className="text-ink font-medium text-sm">Searching for main device{dots}</p>
    </div>
  )
}

function NotFoundState({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-control bg-warning-50 border border-warning-100 px-4 py-3">
      <p className="text-warning-700 font-medium text-sm">Unable to locate main device</p>
      <button
        onClick={onRetry}
        className="text-sm font-semibold text-primary-700 hover:text-primary-800"
      >
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
      <p className="text-sm font-semibold text-ink">{services.length} device(s) found</p>
      <p className="text-muted text-xs">Select a device to connect</p>
      <div className="mt-3 flex flex-col gap-2">
        {services.map((service, index) => (
          <button
            key={index}
            onClick={() => onSelect(service)}
            className="w-full p-3 rounded-control border border-line bg-white flex justify-between items-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-app text-primary-700">
                <BsFillHddNetworkFill className="text-base" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-ink text-sm font-semibold">{service.name}</h3>
                <span className="text-muted text-xs">
                  {service.ip}:{service.port}
                </span>
              </div>
            </div>
            <span className="pill bg-app text-muted">Tap to connect</span>
          </button>
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
    <div className="mt-5 border-t border-line pt-4">
      <p className="text-muted text-xs font-semibold mb-2">
        Or connect manually — ask for the Host device IP shown on its screen
      </p>
      <div className="flex items-center gap-2">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="192.168.0.12"
          className="input flex-1"
        />
        <input
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="3000"
          className="input w-20"
        />
        <button onClick={handleManual} className="btn-primary shrink-0">
          Connect
        </button>
      </div>
    </div>
  )
}

export default ConnectionModal
