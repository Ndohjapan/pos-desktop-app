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
    <div className="fixed inset-0 z-50 bg-app flex flex-col items-center justify-center p-6">
      <div className="card w-full max-w-md p-8 flex flex-col items-center text-center">
        <img src={Logo} alt="Amala Oluyole" className="w-24 mb-5" />

        {stage === 'pick' && (
          <>
            <h2 className="text-lg font-bold text-ink mb-1">Who is on the register?</h2>
            <p className="text-xs text-muted mb-5">Select your name to sign in</p>
            <div className="flex flex-wrap justify-center gap-2.5 w-full">
              {cashiers.map((cashier) => (
                <button
                  key={cashier.id}
                  onClick={() => {
                    setSelected(cashier)
                    setStage('pin')
                  }}
                  className="px-5 py-3.5 rounded-control bg-white border border-line hover:border-primary-300 hover:bg-primary-50/40 text-ink font-semibold min-w-[130px] transition-colors"
                >
                  {cashier.fullName}
                  {cashier.role === 'supervisor' && (
                    <span className="block text-[10px] font-medium text-warning-700 mt-0.5">
                      Supervisor
                    </span>
                  )}
                </button>
              ))}
              {cashiers.length === 0 && (
                <p className="text-sm text-muted max-w-xs">
                  No cashier accounts yet. The owner can add them in Admin → Staff.
                </p>
              )}
            </div>
          </>
        )}

        {stage === 'pin' && selected && (
          <>
            <h2 className="text-lg font-bold text-ink mb-5">Hi {selected.fullName}</h2>
            <PinPad onSubmit={handlePin} busy={busy} />
            <button
              onClick={() => {
                setSelected(null)
                setStage('pick')
              }}
              className="mt-4 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Not you? Go back
            </button>
          </>
        )}

        {stage === 'float' && pendingCashier && (
          <>
            <h2 className="text-lg font-bold text-ink mb-1">Open your shift</h2>
            <p className="text-xs text-muted mb-5">
              Count the cash currently in the drawer (your float)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted font-bold text-lg">₦</span>
              <input
                type="number"
                min="0"
                value={float}
                onChange={(e) => setFloat(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-40 px-3 py-3 text-lg text-center rounded-control border border-line focus:outline-none focus:border-primary-500 focus:shadow-focus"
              />
            </div>
            <button
              onClick={handleOpenShift}
              disabled={busy}
              className="btn-primary mt-5 px-8 py-3"
            >
              {busy ? 'Opening…' : 'Start Shift'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default CashierLogin
