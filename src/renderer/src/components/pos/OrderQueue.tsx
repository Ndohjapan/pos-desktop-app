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
        className={`rounded-card border p-4 bg-surface shadow-card ${
          isReady ? 'border-success-500' : minutes >= 15 ? 'border-danger-500' : 'border-line'
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-3xl font-extrabold text-ink tracking-tight">{ticketNo(order)}</span>
          <span
            className={`pill ${minutes >= 15 ? 'bg-danger-50 text-danger-600' : 'bg-app text-muted'}`}
          >
            {minutes}m
          </span>
        </div>
        {order.cashierName && <p className="text-xs text-muted mt-0.5">{order.cashierName}</p>}
        <div className="mt-2.5 space-y-1 max-h-32 overflow-y-auto">
          {items.map((item, index) => (
            <p key={index} className="text-sm text-ink">
              <b className="text-primary-700">{item.quantity}×</b> {item.foodName}
            </p>
          ))}
        </div>
        <button
          onClick={() => advance(order, isReady ? 'served' : 'ready')}
          disabled={busyId === order.id}
          className={`mt-3 w-full py-2.5 rounded-control font-semibold text-sm disabled:opacity-50 transition-colors ${
            isReady
              ? 'bg-success-600 text-white hover:bg-success-700'
              : 'bg-primary-700 text-white hover:bg-primary-800'
          }`}
        >
          {busyId === order.id ? '…' : isReady ? 'Served — clear' : 'Mark Ready'}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full py-5 px-6 md:px-10">
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-bold text-ink mb-3">
              Preparing <span className="text-muted">({preparing.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {preparing.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {preparing.length === 0 && (
                <p className="text-sm text-muted col-span-full">Nothing being prepared</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-ink mb-3">
              Ready for pickup <span className="text-muted">({ready.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ready.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {ready.length === 0 && (
                <p className="text-sm text-muted col-span-full">Nothing waiting</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderQueue
