import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { posApi } from '@renderer/api/pos'
import { useSettingsStore } from '@renderer/store/pos'
import type { StoreSettings } from '@renderer/types'

interface Branch {
  branchId: string
  branchName: string
}

function Toggle({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}): JSX.Element {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-line cursor-pointer">
      <span>
        <span className="block font-semibold text-ink text-sm">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span className="relative inline-flex items-center shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></span>
      </span>
    </label>
  )
}

/**
 * Owner-only store configuration: branch identity (multi-store reporting),
 * Quick-Service mode (queue, ticket numbers, kitchen flow), cashier accounts,
 * and kitchen printer selection.
 */
function StoreSettingsPanel(): JSX.Element {
  const setGlobalSettings = useSettingsStore((state) => state.setSettings)
  const [form, setForm] = useState<StoreSettings | null>(null)
  const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([])
  const [saving, setSaving] = useState(false)

  // Branch change (guarded: dropdown → confirm → admin password)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    posApi
      .getSettings()
      .then((response) => {
        setForm(response.data)
        setSelectedBranchId(response.data.branchId)
      })
      .catch(() => undefined)
    window.api
      .getPrinters()
      .then((result) => {
        if (result.success && result.data) setPrinters(result.data)
      })
      .catch(() => undefined)
    window.api
      .getAvailableBranches()
      .then((list) => setBranches(list))
      .catch(() => undefined)
  }, [])

  const save = async (): Promise<void> => {
    if (!form) return
    try {
      setSaving(true)
      const { data } = await posApi.updateSettings(form)
      setGlobalSettings(data)
      setForm(data)
      toast.success('Settings saved')
    } catch {
      // toast shown by api layer
    } finally {
      setSaving(false)
    }
  }

  const confirmBranchChange = async (): Promise<void> => {
    if (!form) return
    const branch = branches.find((b) => b.branchId === selectedBranchId)
    if (!branch) {
      toast.error('Please select a store')
      return
    }
    if (!password) {
      toast.error('Enter your password to confirm')
      return
    }
    try {
      setChanging(true)
      const { data } = await posApi.changeBranch(branch.branchId, branch.branchName, password)
      setGlobalSettings(data)
      setForm(data)
      setSelectedBranchId(data.branchId)
      setConfirmOpen(false)
      setPassword('')
      toast.success(`Store changed to ${branch.branchName}`)
    } catch {
      // toast shown by api layer
    } finally {
      setChanging(false)
    }
  }

  if (!form) {
    return (
      <div className="w-full max-w-xl px-8 md:px-24 mt-7">
        <div className="h-40 bg-gray-200 animate-pulse rounded-md" />
      </div>
    )
  }

  // Always keep the machine's current store selectable, even if it isn't in the
  // fetched list (offline fallback, or a retired branch id).
  const branchOptions: Branch[] = branches.some((b) => b.branchId === form.branchId)
    ? branches
    : [{ branchId: form.branchId, branchName: form.branchName || form.branchId }, ...branches]

  const branchChanged = selectedBranchId !== '' && selectedBranchId !== form.branchId
  const targetBranchName =
    branches.find((b) => b.branchId === selectedBranchId)?.branchName || selectedBranchId

  return (
    <>
      <div className="w-full max-w-2xl px-6 md:px-10 py-7">
        <div className="card p-6 md:p-8">
          <h1 className="text-xl font-bold text-ink">Store Settings</h1>

          {/* Branch / store — changeable, but deliberately guarded (confirm +
            password) because it moves where this machine's sales are recorded. */}
          <h2 className="mt-5 text-sm font-bold text-ink">Store / Branch</h2>
          <label className="label mt-2">This computer&apos;s store</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="input"
          >
            {branchOptions.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.branchName}
              </option>
            ))}
          </select>
          {branchChanged ? (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => {
                  setPassword('')
                  setConfirmOpen(true)
                }}
                className="btn-primary"
              >
                Change store…
              </button>
              <button onClick={() => setSelectedBranchId(form.branchId)} className="btn-ghost">
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted mt-1.5">
              Every sale from this computer is recorded under this store on the dashboard.
            </p>
          )}

          <h2 className="mt-6 text-sm font-bold text-ink">Service mode</h2>
          <Toggle
            label="Quick-Service mode (walk-in store)"
            hint="Adds the order queue, big ticket numbers, kitchen flow and daily summary — built for high-frequency service"
            checked={form.quickService}
            onChange={(value) => setForm({ ...form, quickService: value })}
          />
          <Toggle
            label="Cashier accounts & shifts"
            hint="Cashiers sign in with a PIN, open/close shifts with cash counts, and every order records who sold it"
            checked={form.cashiersEnabled}
            onChange={(value) => setForm({ ...form, cashiersEnabled: value })}
          />

          <h2 className="mt-6 text-sm font-bold text-ink">Kitchen printing</h2>
          <Toggle
            label="Print kitchen tickets automatically"
            hint="The moment an order is paid, a slip prints in the kitchen (no prices, big quantities)"
            checked={form.kitchenPrintingEnabled}
            onChange={(value) => setForm({ ...form, kitchenPrintingEnabled: value })}
          />
          {form.kitchenPrintingEnabled && (
            <div className="mt-3">
              <label className="label">Kitchen printer</label>
              <select
                value={form.kitchenPrinterName}
                onChange={(e) => setForm({ ...form, kitchenPrinterName: e.target.value })}
                className="input"
              >
                <option value="">System default printer</option>
                {printers.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.name}
                    {printer.isDefault ? ' (default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">
                Printers are read from this computer — set the kitchen printer up in Windows first.
              </p>
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn-primary mt-8 px-8 py-3">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Confirm + re-authenticate before switching the branch. */}
      {confirmOpen && (
        <div className="overlay" onClick={() => !changing && setConfirmOpen(false)}>
          <div
            className="card w-full max-w-md p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-ink">Change store?</h2>
            <p className="text-sm text-muted mt-2">
              You&apos;re about to change this computer from{' '}
              <span className="font-semibold text-ink">{form.branchName || 'Not set'}</span> to{' '}
              <span className="font-semibold text-ink">{targetBranchName}</span>. From now on, every
              sale from this computer will be recorded under the new store. Enter your password to
              confirm.
            </p>
            <label className="label mt-4">Your admin password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmBranchChange()
              }}
              autoFocus
              className="input"
              placeholder="••••••••"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={changing}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmBranchChange}
                disabled={changing || !password}
                className="btn-primary"
              >
                {changing ? 'Changing…' : 'Change store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StoreSettingsPanel
