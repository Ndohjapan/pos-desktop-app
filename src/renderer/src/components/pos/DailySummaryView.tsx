import { useCallback, useEffect, useState } from 'react'
import { posApi } from '@renderer/api/pos'
import type { DailySummary } from '@renderer/types'

const formatNaira = (amount: number): string => `₦${amount.toLocaleString()}`

/**
 * On-device end-of-day view: totals by payment method, order count, voids,
 * discounts and top sellers — without needing the cloud dashboard.
 */
function DailySummaryView(): JSX.Element {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await posApi.getDailySummary(date)
      setSummary(data)
    } catch {
      // toast shown by api layer
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="w-full py-5 px-6 md:px-10 max-w-5xl">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-ink">Daily Summary</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto py-2"
        />
      </div>

      {loading || !summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="card p-4">
              <p className="text-xs text-muted">Orders</p>
              <p className="text-2xl font-extrabold text-ink tracking-tight">{summary.orderCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted">Gross Sales</p>
              <p className="text-2xl font-extrabold text-ink tracking-tight">{formatNaira(summary.grossSales)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted">Discounts</p>
              <p className="text-2xl font-bold text-danger-600">
                {formatNaira(summary.totalDiscount)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted">Voided ({summary.voidCount})</p>
              <p className="text-2xl font-bold text-danger-600">
                {formatNaira(summary.voidedAmount)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h2 className="font-bold text-ink text-sm mb-2">Sales by payment method</h2>
              <div className="card divide-y divide-line overflow-hidden">
                {summary.byPaymentMethod.map((row) => (
                  <div key={row.paymentMethod} className="flex justify-between px-4 py-2 text-sm">
                    <span>
                      {row.paymentMethod} <span className="text-muted">×{row.count}</span>
                    </span>
                    <span className="font-medium">{formatNaira(row.amount)}</span>
                  </div>
                ))}
                {summary.byPaymentMethod.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted">No sales</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-ink text-sm mb-2">Top sellers</h2>
              <div className="card divide-y divide-line overflow-hidden">
                {summary.topItems.map((item, index) => (
                  <div key={item.foodName} className="flex justify-between px-4 py-2 text-sm">
                    <span>
                      <span className="text-muted mr-2">{index + 1}.</span>
                      {item.foodName}
                    </span>
                    <span>
                      <b>{item.quantity}</b>
                      <span className="text-muted ml-2">{formatNaira(item.amount)}</span>
                    </span>
                  </div>
                ))}
                {summary.topItems.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted">No items sold</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DailySummaryView
