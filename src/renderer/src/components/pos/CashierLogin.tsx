import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { posApi } from '@renderer/api/pos'
import { useCashierStore } from '@renderer/store/pos'
import { round2 } from '@renderer/utils/money'
import type { CashierPublic } from '@renderer/types'
import PinPad from './PinPad'
import Logo from '@renderer/assets/images/logo.svg'

/**
 * Full-screen cashier sign-in: pick your name → enter PIN → open (or resume)
 * your shift with an opening cash float. Shown whenever cashiers are enabled
 * and nobody is signed in at this till.
 */
function CashierLogin(): JSX.Element {
  const [cashiers, setCashiers] = useState<CashierPublic[]>([])
  const [selected, setSelected] = useState<CashierPublic | null>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<'pick' | 'pin' | 'float'>('pick')
  const [float, setFloat] = useState('')
  const [pendingCashier, setPendingCashier] = useState<CashierPublic | null>(null)
  const setCashier = useCashierStore((state) => state.setCashier)
  const setShift = useCashierStore((state) => state.setShift)

  useEffect(() => {
    posApi
      .listCashiers()
      .then((response) => setCashiers(response.data))
      .catch(() => undefined)
  }, [])

  const handlePin = async (pin: string): Promise<void> => {
    if (!selected) return
    try {
      setBusy(true)
      const { data: cashier } = await posApi.cashierLogin(selected.id, pin)

      // Resume an open shift if one exists; otherwise ask for the float.
      const { data: shift } = await posApi.currentShift(cashier.id)
      if (shift) {
        setCashier(cashier)
        setShift(shift)
        toast.success(`Welcome back, ${cashier.fullName}`)
      } else {
        setPendingCashier(cashier)
        setStage('float')
      }
    } catch {
      // toast shown by the api layer
    } finally {
      setBusy(false)
    }
  }

  const handleOpenShift = async (): Promise<void> => {
    if (!pendingCashier) return
    try {
      setBusy(true)
      const openingFloat = round2(parseFloat(float) || 0)
      const { data: shift } = await posApi.openShift(pendingCashier.id, openingFloat)
      setCashier(pendingCashier)
      setShift(shift)
      toast.success(`Shift opened — welcome, ${pendingCashier.fullName}`)
    } catch {
      // toast shown by the api layer
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
      <img src={Logo} alt="Amala Oluyole" className="max-w-[140px] mb-4" />

      {stage === 'pick' && (
        <>
          <h2 className="text-lg font-bold text-secondary mb-1">Who is on the register?</h2>
          <p className="text-xs text-gray-500 mb-4">Select your name to sign in</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-lg">
            {cashiers.map((cashier) => (
              <button
                key={cashier.id}
                onClick={() => {
                  setSelected(cashier)
                  setStage('pin')
                }}
                className="px-6 py-4 rounded-xl bg-[#F5F5F5] hover:bg-[#ECECEC] text-secondary font-bold min-w-[140px]"
              >
                {cashier.fullName}
                {cashier.role === 'supervisor' && (
                  <span className="block text-[10px] font-medium text-yellow-700 mt-1">
                    Supervisor
                  </span>
                )}
              </button>
            ))}
            {cashiers.length === 0 && (
              <p className="text-sm text-gray-500 max-w-xs text-center">
                No cashier accounts yet. The owner can add them in Admin → Staff.
              </p>
            )}
          </div>
        </>
      )}

      {stage === 'pin' && selected && (
        <>
          <h2 className="text-lg font-bold text-secondary mb-4">Hi {selected.fullName}</h2>
          <PinPad onSubmit={handlePin} busy={busy} />
          <button
            onClick={() => {
              setSelected(null)
              setStage('pick')
            }}
            className="mt-4 text-sm text-primary-700 underline"
          >
            Not you? Go back
          </button>
        </>
      )}

      {stage === 'float' && pendingCashier && (
        <>
          <h2 className="text-lg font-bold text-secondary mb-1">Open your shift</h2>
          <p className="text-xs text-gray-500 mb-4">
            Count the cash currently in the drawer (your float)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-secondary font-bold">₦</span>
            <input
              type="number"
              min="0"
              value={float}
              onChange={(e) => setFloat(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-40 px-3 py-3 text-lg rounded-lg border border-[#DCDCDC] focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            onClick={handleOpenShift}
            disabled={busy}
            className="mt-4 px-8 py-3 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-900 disabled:opacity-50"
          >
            {busy ? 'Opening…' : 'Start Shift'}
          </button>
        </>
      )}
    </div>
  )
}

export default CashierLogin
