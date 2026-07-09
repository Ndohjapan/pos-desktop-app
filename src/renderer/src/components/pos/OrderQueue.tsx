import { useCallback, useEffect, useState } from 'react'
import { posApi } from '@renderer/api/pos'
import type { FulfillmentStatus, Order } from '@renderer/types'

const POLL_MS = 8000

function ticketNo(order: Order): string {
  return `#${String(order.orderNumber || order.id).padStart(3, '0')}`
}

function ageMinutes(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
}

/**
 * Live order queue for high-frequency service: every paid order appears here
 * with its big ticket number and moves preparing → ready → served. Polls the
 * host so all tills see the same queue.
 */
function OrderQueue(): JSX.Element {
  const [queue, setQueue] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await posApi.getQueue()
      setQueue(data)
    } catch {
      // silent — transient network blips shouldn't toast every poll
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_MS)
    return () => clearInterval(interval)
  }, [load])

  const advance = async (order: Order, next: FulfillmentStatus): Promise<void> => {
    try {
      setBusyId(order.id)
      await posApi.setFulfillment(order.id, next)
      await load()
    } catch {
      // toast shown by api layer
    } finally {
      setBusyId(null)
    }
  }

  const preparing = queue.filter((order) => order.fulfillment === 'preparing')
  const ready = queue.filter((order) => order.fulfillment === 'ready')

  const OrderCard = ({ order }: { order: Order }): JSX.Element => {
    const items = order.groups.flatMap((group) => group.items)
    const minutes = ageMinutes(order.createdAt)
    const isReady = order.fulfillment === 'ready'

    return (
      <div
        className={`rounded-xl border-2 p-4 bg-white ${
          isReady ? 'border-[#01A920]' : minutes >= 15 ? 'border-[#FD0002]' : 'border-[#DCDCDC]'
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-3xl font-extrabold text-secondary">{ticketNo(order)}</span>
          <span
            className={`text-xs px-2 py-1 rounded ${minutes >= 15 ? 'bg-[#F5E6E8] text-[#FD0002]' : 'bg-[#F5F5F5] text-gray-600'}`}
          >
            {minutes}m
          </span>
        </div>
        {order.cashierName && <p className="text-xs text-gray-400 mt-0.5">{order.cashierName}</p>}
        <div className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
          {items.map((item, index) => (
            <p key={index} className="text-sm text-secondary">
              <b>{item.quantity}×</b> {item.foodName}
            </p>
          ))}
        </div>
        <button
          onClick={() => advance(order, isReady ? 'served' : 'ready')}
          disabled={busyId === order.id}
          className={`mt-3 w-full py-2 rounded-lg font-bold text-sm disabled:opacity-50 ${
            isReady
              ? 'bg-[#01A920] text-white hover:opacity-90'
              : 'bg-primary-700 text-white hover:bg-primary-900'
          }`}
        >
          {busyId === order.id ? '…' : isReady ? 'Served — clear' : 'Mark Ready'}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full py-4 px-8">
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-bold text-secondary mb-3">
              Preparing <span className="text-gray-400">({preparing.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {preparing.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {preparing.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">Nothing being prepared</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-secondary mb-3">
              Ready for pickup <span className="text-gray-400">({ready.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ready.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {ready.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">Nothing waiting</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderQueue
