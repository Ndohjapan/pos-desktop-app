import { useCallback, useEffect, useState } from 'react'
import { FaPlay, FaTrash, FaPause } from 'react-icons/fa'
import { posApi } from '@renderer/api/pos'
import type { ParkedOrder } from '@renderer/types'
import type { DraftOrderGroup } from '../CreateOrder'

const POLL_MS = 15000

function ageLabel(createdAt: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt + 'Z').getTime()) / 60000)
  )
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/**
 * The held-orders strip: every parked order shows as a chip with its label and
 * age. Tap ▶ to resume it into the register. Updates live across tills.
 */
function HeldOrdersBar({
  onResume
}: {
  onResume: (groups: DraftOrderGroup[], parkedOrderId: number) => void
}): JSX.Element | null {
  const [parked, setParked] = useState<ParkedOrder[]>([])

  const load = useCallback(async () => {
    try {
      const { data } = await posApi.listParked()
      setParked(data)
    } catch {
      // silent; strip just stays as-is on a blip
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_MS)
    const onChanged = (): void => {
      load()
    }
    window.addEventListener('parked-orders-changed', onChanged)
    return () => {
      clearInterval(interval)
      window.removeEventListener('parked-orders-changed', onChanged)
    }
  }, [load])

  const resume = async (order: ParkedOrder): Promise<void> => {
    try {
      // Re-fetch so we never resume a stale copy another till already took.
      const { data } = await posApi.getParked(order.id)
      const payload = JSON.parse(data.payload) as { groups: DraftOrderGroup[] }
      onResume(payload.groups ?? [], data.id)
    } catch {
      load()
    }
  }

  const discard = async (order: ParkedOrder): Promise<void> => {
    if (!window.confirm(`Discard held order "${order.label}"?`)) return
    try {
      await posApi.deleteParked(order.id)
      load()
    } catch {
      // toast shown by api layer
    }
  }

  if (parked.length === 0) return null

  return (
    <div className="w-full px-6 md:px-10 pt-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex items-center gap-1.5 text-xs font-bold text-warning-700 whitespace-nowrap">
          <FaPause className="text-[10px]" /> On hold ({parked.length})
        </span>
        {parked.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-2 bg-warning-50 border border-warning-100 rounded-full pl-3 pr-1 py-1 whitespace-nowrap"
          >
            <span className="text-sm text-ink font-semibold">{order.label}</span>
            <span className="text-xs text-muted">{ageLabel(order.createdAt)}</span>
            <button
              onClick={() => resume(order)}
              title="Resume this order"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-700 text-white hover:bg-primary-800 transition-colors"
            >
              <FaPlay className="text-[10px]" />
            </button>
            <button
              onClick={() => discard(order)}
              title="Discard"
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-danger-600 hover:bg-white transition-colors"
            >
              <FaTrash className="text-[10px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeldOrdersBar
