import { useConnectionHealth } from '@renderer/hooks/useConnectionHealth'
import { useConnectionStore } from '@renderer/store/connection'

const STATUS_STYLES = {
  connected: { dot: 'bg-[#01A920]', text: 'text-[#01A920]', label: 'Connected' },
  reconnecting: { dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-600', label: 'Reconnecting…' },
  offline: { dot: 'bg-[#FD0002]', text: 'text-[#FD0002]', label: 'Disconnected' }
} as const

/**
 * Persistent connection indicator for the nav bar. On the Main machine it shows
 * the LAN IP other tills should connect to; on tills it shows live link health.
 */
function ConnectionStatus(): JSX.Element {
  const { status } = useConnectionHealth()
  const type = useConnectionStore((state) => state.type)
  const hostIp = useConnectionStore((state) => state.hostIp)
  const mainSystemIP = useConnectionStore((state) => state.host)

  const style = STATUS_STYLES[status]
  const isMain = type === 'Main'

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${style.dot}`} />
      <span className={`font-medium ${style.text}`}>{style.label}</span>
      {isMain && hostIp ? (
        <span className="text-secondary/70 hidden md:inline">· This device: {hostIp}</span>
      ) : (
        !isMain &&
        mainSystemIP && <span className="text-secondary/70 hidden md:inline">· Host: {mainSystemIP}</span>
      )}
    </div>
  )
}

export default ConnectionStatus
