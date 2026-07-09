import { useState } from 'react'
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
          className="flex items-center gap-2 bg-[#F5F5F5] border border-[#DCDCDC] px-3 py-1 rounded-lg text-secondary text-sm"
        >
          <FaUserCircle className="text-primary-700" />
          {cashier.fullName}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DCDCDC] rounded-lg shadow-lg z-40 text-sm">
            <button
              onClick={showXReport}
              className="block w-full text-left px-4 py-2 hover:bg-[#F5F5F5]"
            >
              Shift report (X)
            </button>
            <button
              onClick={startCloseShift}
              className="block w-full text-left px-4 py-2 hover:bg-[#F5F5F5]"
            >
              Close shift (Z)
            </button>
            <button
              onClick={switchCashier}
              className="block w-full text-left px-4 py-2 hover:bg-[#F5F5F5] text-[#FD0002]"
            >
              Switch cashier
            </button>
          </div>
        )}
      </div>

      {report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-secondary">
                {closing ? 'Close Shift' : 'Shift Report'}
              </h2>
              <button
                onClick={() => setReport(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>

            <ShiftReportView report={report} />

            {closing && (
              <div className="mt-4 border-t border-[#EEE] pt-3">
                <label className="text-xs font-bold text-secondary block mb-1">
                  Cash counted in drawer (₦)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={counted}
                    onChange={(e) => setCounted(e.target.value)}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DCDCDC] focus:outline-none focus:border-primary-500"
                  />
                  <button
                    onClick={confirmCloseShift}
                    disabled={busy || counted === ''}
                    className="px-5 py-2 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-900 disabled:opacity-50"
                  >
                    {busy ? 'Closing…' : 'Close Shift'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default CashierBadge
