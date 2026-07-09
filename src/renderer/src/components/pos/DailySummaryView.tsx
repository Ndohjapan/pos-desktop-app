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
    <div className="w-full py-4 px-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-secondary">Daily Summary</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-sm border border-[#DCDCDC] bg-[#F0F1F2] text-[#6B7280] text-xs"
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
            <div className="bg-[#F6F6F6] rounded-md p-4">
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-2xl font-bold text-secondary">{summary.orderCount}</p>
            </div>
            <div className="bg-[#F6F6F6] rounded-md p-4">
              <p className="text-xs text-gray-500">Gross Sales</p>
              <p className="text-2xl font-bold text-secondary">{formatNaira(summary.grossSales)}</p>
            </div>
            <div className="bg-[#F6F6F6] rounded-md p-4">
              <p className="text-xs text-gray-500">Discounts</p>
              <p className="text-2xl font-bold text-[#FD0002]">
                {formatNaira(summary.totalDiscount)}
              </p>
            </div>
            <div className="bg-[#F6F6F6] rounded-md p-4">
              <p className="text-xs text-gray-500">Voided ({summary.voidCount})</p>
              <p className="text-2xl font-bold text-[#FD0002]">
                {formatNaira(summary.voidedAmount)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h2 className="font-bold text-secondary text-sm mb-2">Sales by payment method</h2>
              <div className="bg-white border border-[#EEE] rounded-md divide-y divide-[#F0F0F0]">
                {summary.byPaymentMethod.map((row) => (
                  <div key={row.paymentMethod} className="flex justify-between px-4 py-2 text-sm">
                    <span>
                      {row.paymentMethod} <span className="text-gray-400">×{row.count}</span>
                    </span>
                    <span className="font-medium">{formatNaira(row.amount)}</span>
                  </div>
                ))}
                {summary.byPaymentMethod.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">No sales</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-secondary text-sm mb-2">Top sellers</h2>
              <div className="bg-white border border-[#EEE] rounded-md divide-y divide-[#F0F0F0]">
                {summary.topItems.map((item, index) => (
                  <div key={item.foodName} className="flex justify-between px-4 py-2 text-sm">
                    <span>
                      <span className="text-gray-400 mr-2">{index + 1}.</span>
                      {item.foodName}
                    </span>
                    <span>
                      <b>{item.quantity}</b>
                      <span className="text-gray-400 ml-2">{formatNaira(item.amount)}</span>
                    </span>
                  </div>
                ))}
                {summary.topItems.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">No items sold</p>
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
