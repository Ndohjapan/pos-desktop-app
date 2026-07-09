import type { ShiftReport } from '@renderer/types'

const formatNaira = (amount: number): string => `₦${amount.toLocaleString()}`

/**
 * Renders a shift report — used both as the live X report and the final Z
 * report after closing (when counted cash + variance are present).
 */
function ShiftReportView({ report }: { report: ShiftReport }): JSX.Element {
  const openedAt = new Date(report.shift.openedAt + 'Z').toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return (
    <div className="text-sm">
      <div className="flex justify-between text-xs text-gray-500 mb-3">
        <span>
          {report.shift.cashierName} · opened {openedAt}
        </span>
        <span>{report.shift.closedAt ? 'CLOSED (Z)' : 'LIVE (X)'}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#F6F6F6] rounded-md p-3">
          <p className="text-xs text-gray-500">Orders</p>
          <p className="text-xl font-bold text-secondary">{report.orderCount}</p>
        </div>
        <div className="bg-[#F6F6F6] rounded-md p-3">
          <p className="text-xs text-gray-500">Gross Sales</p>
          <p className="text-xl font-bold text-secondary">{formatNaira(report.grossSales)}</p>
        </div>
      </div>

      <h4 className="font-bold text-secondary text-xs mb-1">Sales by payment method</h4>
      <div className="mb-3">
        {report.byPaymentMethod.map((row) => (
          <div key={row.paymentMethod} className="flex justify-between py-1 border-b border-[#EEE]">
            <span>
              {row.paymentMethod} <span className="text-gray-400">×{row.count}</span>
            </span>
            <span className="font-medium">{formatNaira(row.amount)}</span>
          </div>
        ))}
        {report.byPaymentMethod.length === 0 && (
          <p className="text-xs text-gray-400 py-1">No sales yet</p>
        )}
      </div>

      {(report.totalDiscount > 0 || report.voidCount > 0) && (
        <div className="mb-3 text-xs">
          {report.totalDiscount > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Discounts given</span>
              <span className="text-[#FD0002]">-{formatNaira(report.totalDiscount)}</span>
            </div>
          )}
          {report.voidCount > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Voided orders ({report.voidCount})</span>
              <span className="text-[#FD0002]">{formatNaira(report.voidedAmount)}</span>
            </div>
          )}
        </div>
      )}

      <h4 className="font-bold text-secondary text-xs mb-1">Cash drawer</h4>
      <div className="bg-[#F6F6F6] rounded-md p-3 space-y-1">
        <div className="flex justify-between">
          <span>Opening float</span>
          <span>{formatNaira(report.shift.openingFloat)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cash sales</span>
          <span>{formatNaira(report.cashSales)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-[#DDD] pt-1">
          <span>Expected in drawer</span>
          <span>{formatNaira(report.expectedCash)}</span>
        </div>
        {report.countedCash !== null && (
          <>
            <div className="flex justify-between">
              <span>Counted</span>
              <span>{formatNaira(report.countedCash)}</span>
            </div>
            <div
              className={`flex justify-between font-bold ${
                (report.variance ?? 0) === 0
                  ? 'text-[#01A920]'
                  : (report.variance ?? 0) > 0
                    ? 'text-yellow-600'
                    : 'text-[#FD0002]'
              }`}
            >
              <span>Variance</span>
              <span>
                {(report.variance ?? 0) > 0 ? '+' : ''}
                {formatNaira(report.variance ?? 0)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ShiftReportView
