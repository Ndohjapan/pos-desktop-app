import { useEffect, useRef, useState } from 'react'
import { useConnectionStore } from '@renderer/store/connection'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline'

const HEALTHY_INTERVAL = 10000 // poll every 10s while healthy
const RETRY_INTERVAL = 3000 // poll faster (3s) while trying to reconnect
const OFFLINE_AFTER_FAILURES = 3 // show hard "offline" after 3 straight misses

/**
 * Continuously verifies the till can still reach the Main machine and drives
 * a live status. Replaces the old "connect once and hope" behaviour: transient
 * network drops now auto-recover instead of surfacing as scattered API errors.
 */
export function useConnectionHealth(): { status: ConnectionStatus; checkNow: () => void } {
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  const [status, setStatus] = useState<ConnectionStatus>('connected')
  const failuresRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const runCheck = async (): Promise<void> => {
    if (!host || !port) return

    const result = await window.api.checkHealth(host, port)
    if (cancelledRef.current) return

    if (result.ok) {
      failuresRef.current = 0
      setStatus('connected')
    } else {
      failuresRef.current += 1
      setStatus(failuresRef.current >= OFFLINE_AFTER_FAILURES ? 'offline' : 'reconnecting')
    }

    // Schedule the next probe — faster while we're unhealthy so recovery is quick.
    const delay = failuresRef.current === 0 ? HEALTHY_INTERVAL : RETRY_INTERVAL
    timerRef.current = setTimeout(runCheck, delay)
  }

  const checkNow = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current)
    runCheck()
  }

  useEffect(() => {
    cancelledRef.current = false
    failuresRef.current = 0
    runCheck()
    return () => {
      cancelledRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // Re-establish polling whenever the target host/port changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, port])

  return { status, checkNow }
}
