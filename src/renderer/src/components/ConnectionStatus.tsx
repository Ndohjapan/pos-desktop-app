import { useConnectionHealth } from '@renderer/hooks/useConnectionHealth'
import { useConnectionStore } from '@renderer/store/connection'

const STATUS_STYLES = {
  connected: { dot: 'bg-success-600', text: 'text-success-700', label: 'Connected' },
  reconnecting: {
    dot: 'bg-warning-600 animate-pulse',
    text: 'text-warning-700',
    label: 'Reconnecting…'
  },
  offline: { dot: 'bg-danger-600', text: 'text-danger-600', label: 'Disconnected' }
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
    <div className="flex items-center gap-1.5 text-xs mt-0.5">
      <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} />
      <span className={`font-medium ${style.text}`}>{style.label}</span>
      {isMain && hostIp ? (
        <span className="text-muted hidden lg:inline">· This device {hostIp}</span>
      ) : (
        !isMain &&
        mainSystemIP && <span className="text-muted hidden lg:inline">· Host {mainSystemIP}</span>
      )}
    </div>
  )
}

export default ConnectionStatus
