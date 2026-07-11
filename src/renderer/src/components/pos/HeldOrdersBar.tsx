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
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <span className="flex items-center gap-1.5 text-sm font-bold text-warning-700 whitespace-nowrap">
          <FaPause className="text-xs" /> On hold ({parked.length})
        </span>
        {parked.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-2.5 bg-warning-50 border border-warning-100 rounded-2xl pl-4 pr-2 py-2 whitespace-nowrap"
          >
            <div className="flex flex-col leading-tight mr-1">
              <span className="text-base text-ink font-bold">{order.label}</span>
              <span className="text-xs text-muted">{ageLabel(order.createdAt)}</span>
            </div>
            <button
              onClick={() => resume(order)}
              title="Resume this order"
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary-700 text-white hover:bg-primary-800 active:scale-95 transition-all"
            >
              <FaPlay className="text-base" />
            </button>
            <button
              onClick={() => discard(order)}
              title="Discard"
              className="w-12 h-12 flex items-center justify-center rounded-xl text-muted hover:text-danger-600 hover:bg-white active:scale-95 transition-all"
            >
              <FaTrash className="text-base" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeldOrdersBar
