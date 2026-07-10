import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { posApi } from '@renderer/api/pos'
import type { CashierPublic, CashierRole } from '@renderer/types'

/**
 * Owner-managed cashier accounts: short PINs for fast till switching.
 * Supervisors can approve voids and discounts with their PIN.
 */
function CashiersPanel(): JSX.Element {
  const [cashiers, setCashiers] = useState<CashierPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  // add form
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<CashierRole>('cashier')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await posApi.listAllCashiers()
      setCashiers(data)
    } catch {
      // toast shown by api layer
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (): Promise<void> => {
    if (!name.trim()) {
      toast.error('Enter the cashier’s name')
      return
    }
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error('PIN must be 4–6 digits')
      return
    }
    try {
      setAdding(true)
      await posApi.createCashier({ fullName: name.trim(), pin, role })
      toast.success(`${name.trim()} added`)
      setName('')
      setPin('')
      setRole('cashier')
      await load()
    } catch {
      // toast shown by api layer
    } finally {
      setAdding(false)
    }
  }

  const toggleActive = async (cashier: CashierPublic): Promise<void> => {
    try {
      setBusyId(cashier.id)
      await posApi.updateCashier(cashier.id, { active: !cashier.active })
      await load()
    } catch {
      // toast shown by api layer
    } finally {
      setBusyId(null)
    }
  }

  // window.prompt is not supported inside Electron, so PIN reset uses a modal.
  const [resetTarget, setResetTarget] = useState<CashierPublic | null>(null)
  const [newPin, setNewPin] = useState('')

  const confirmResetPin = async (): Promise<void> => {
    if (!resetTarget) return
    if (!/^\d{4,6}$/.test(newPin)) {
      toast.error('PIN must be 4–6 digits')
      return
    }
    try {
      setBusyId(resetTarget.id)
      await posApi.updateCashier(resetTarget.id, { pin: newPin })
      toast.success(`PIN updated for ${resetTarget.fullName}`)
      setResetTarget(null)
      setNewPin('')
    } catch {
      // toast shown by api layer
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-10 border-t border-line pt-6">
      <h2 className="text-lg font-bold text-secondary">Cashiers &amp; PINs</h2>
      <p className="text-sm text-muted">
        Cashiers sign in at the till with their PIN. Supervisors approve voids and discounts.
      </p>

      {/* Add form */}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs font-bold text-secondary block mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bola"
            className="px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary block mb-1">PIN (4–6 digits)</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="e.g. 2468"
            className="w-32 px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary block mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value === 'supervisor' ? 'supervisor' : 'cashier')}
            className="px-3 py-2 rounded-lg border border-line text-sm bg-white focus:outline-none focus:border-primary-500"
          >
            <option value="cashier">Cashier</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
        <button
          onClick={add}
          disabled={adding}
          className="px-5 py-2 rounded-lg bg-primary-700 text-white text-sm font-bold hover:bg-primary-800 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add Cashier'}
        </button>
      </div>

      {/* List */}
      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-md" />
          ))
        ) : (
          <>
            {cashiers.map((cashier) => (
              <div
                key={cashier.id}
                className="flex items-center justify-between bg-app rounded-md px-4 py-2"
              >
                <div>
                  <p className="font-bold text-secondary text-sm">
                    {cashier.fullName}
                    {cashier.role === 'supervisor' && (
                      <span className="ml-2 text-[10px] bg-warning-50 text-warning-700 px-2 py-0.5 rounded">
                        Supervisor
                      </span>
                    )}
                    {!cashier.active && (
                      <span className="ml-2 text-[10px] bg-danger-50 text-danger-600 px-2 py-0.5 rounded">
                        Disabled
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    onClick={() => {
                      setResetTarget(cashier)
                      setNewPin('')
                    }}
                    disabled={busyId === cashier.id}
                    className="text-primary-700 underline hover:text-primary-900 disabled:opacity-50"
                  >
                    Reset PIN
                  </button>
                  <button
                    onClick={() => toggleActive(cashier)}
                    disabled={busyId === cashier.id}
                    className={`underline disabled:opacity-50 ${cashier.active ? 'text-danger-600' : 'text-success-700'}`}
                  >
                    {cashier.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
            {cashiers.length === 0 && (
              <p className="text-sm text-muted">No cashiers yet — add the team above.</p>
            )}
          </>
        )}
      </div>
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-secondary">
                New PIN for {resetTarget.fullName}
              </h2>
              <button
                onClick={() => setResetTarget(null)}
                className="text-muted hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>
            <input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="4–6 digits"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={confirmResetPin}
              disabled={busyId === resetTarget.id}
              className="mt-3 w-full py-2 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-800 disabled:opacity-50"
            >
              {busyId === resetTarget.id ? 'Saving…' : 'Save PIN'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashiersPanel
