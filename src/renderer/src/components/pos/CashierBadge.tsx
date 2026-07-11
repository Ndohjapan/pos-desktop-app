import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FaUserCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { posApi } from '@renderer/api/pos'
import { useCashierStore, useSettingsStore } from '@renderer/store/pos'
import { round2 } from '@renderer/utils/money'
import type { ShiftReport } from '@renderer/types'
import ShiftReportView from './ShiftReportView'

/**
 * Nav-bar badge for the signed-in cashier: switch cashier, view the live X
 * report, or count the drawer and close the shift (Z report).
 */
function CashierBadge(): JSX.Element | null {
  const cashiersEnabled = useSettingsStore((state) => state.settings.cashiersEnabled)
  const cashier = useCashierStore((state) => state.cashier)
  const shift = useCashierStore((state) => state.shift)
  const clearSession = useCashierStore((state) => state.clearSession)

  const [menuOpen, setMenuOpen] = useState(false)
  const [report, setReport] = useState<ShiftReport | null>(null)
  const [closing, setClosing] = useState(false)
  const [counted, setCounted] = useState('')
  const [busy, setBusy] = useState(false)

  if (!cashiersEnabled || !cashier) return null

  const showXReport = async (): Promise<void> => {
    if (!shift) return
    setMenuOpen(false)
    try {
      const { data } = await posApi.shiftReport(shift.id)
      setReport(data)
      setClosing(false)
    } catch {
      // toast shown by api layer
    }
  }

  const startCloseShift = async (): Promise<void> => {
    if (!shift) return
    setMenuOpen(false)
    try {
      const { data } = await posApi.shiftReport(shift.id)
      setReport(data)
      setClosing(true)
      setCounted('')
    } catch {
      // toast shown by api layer
    }
  }

  const confirmCloseShift = async (): Promise<void> => {
    if (!shift) return
    try {
      setBusy(true)
      const { data } = await posApi.closeShift(shift.id, round2(parseFloat(counted) || 0))
      setReport(data)
      setClosing(false)
      clearSession()
      toast.success('Shift closed')
    } catch {
      // toast shown by api layer
    } finally {
      setBusy(false)
    }
  }

  const switchCashier = (): void => {
    setMenuOpen(false)
    // Keep the shift open — another cashier signs in on top; the original
    // cashier's shift remains theirs until they close it.
    clearSession()
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 bg-white border border-line px-3 py-2 rounded-control text-ink text-sm font-semibold hover:bg-app transition-colors"
        >
          <FaUserCircle className="text-primary-700 text-base" />
          {cashier.fullName}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 card shadow-elevated z-40 text-sm overflow-hidden p-1">
            <button
              onClick={showXReport}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-app text-ink font-medium"
            >
              Shift report (X)
            </button>
            <button
              onClick={startCloseShift}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-app text-ink font-medium"
            >
              Close shift (Z)
            </button>
            <button
              onClick={switchCashier}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-danger-50 text-danger-600 font-medium"
            >
              Switch cashier
            </button>
          </div>
        )}
      </div>

      {report &&
        createPortal(
          <div className="overlay" onClick={() => setReport(null)}>
            <div
              className="card w-full max-w-md p-6 shadow-elevated max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-ink">
                  {closing ? 'Close Shift' : 'Shift Report'}
                </h2>
                <button
                  onClick={() => setReport(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:bg-app hover:text-ink text-xl"
                >
                  &times;
                </button>
              </div>

              <ShiftReportView report={report} />

              {closing && (
                <div className="mt-4 border-t border-line pt-4">
                  <label className="label">Cash counted in drawer (₦)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={counted}
                      onChange={(e) => setCounted(e.target.value)}
                      autoFocus
                      className="input flex-1"
                    />
                    <button
                      onClick={confirmCloseShift}
                      disabled={busy || counted === ''}
                      className="btn-primary shrink-0"
                    >
                      {busy ? 'Closing…' : 'Close Shift'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default CashierBadge
