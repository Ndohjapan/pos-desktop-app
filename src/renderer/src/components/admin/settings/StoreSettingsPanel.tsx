import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { posApi } from '@renderer/api/pos'
import { useSettingsStore } from '@renderer/store/pos'
import type { StoreSettings } from '@renderer/types'

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
    <label className="flex items-start justify-between gap-4 py-3 border-b border-[#F0F0F0] cursor-pointer">
      <span>
        <span className="block font-medium text-secondary text-sm">{label}</span>
        <span className="block text-xs text-gray-500">{hint}</span>
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

  useEffect(() => {
    posApi
      .getSettings()
      .then((response) => setForm(response.data))
      .catch(() => undefined)
    window.api
      .getPrinters()
      .then((result) => {
        if (result.success && result.data) setPrinters(result.data)
      })
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

  if (!form) {
    return (
      <div className="w-full max-w-xl px-8 md:px-24 mt-7">
        <div className="h-40 bg-gray-200 animate-pulse rounded-md" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl px-8 md:px-24 mt-7 pb-10">
      <h1 className="text-xl font-bold text-secondary">Store Settings</h1>

      {/* Which store this machine is was chosen once at setup (not editable here
          on purpose — it can't be changed by accident). Shown read-only for
          reference. */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-gray-500">This computer&apos;s store:</span>
        <span className="font-bold text-secondary">{form.branchName || 'Not set'}</span>
      </div>

      <h2 className="mt-6 text-sm font-bold text-secondary">Service mode</h2>
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

      <h2 className="mt-6 text-sm font-bold text-secondary">Kitchen printing</h2>
      <Toggle
        label="Print kitchen tickets automatically"
        hint="The moment an order is paid, a slip prints in the kitchen (no prices, big quantities)"
        checked={form.kitchenPrintingEnabled}
        onChange={(value) => setForm({ ...form, kitchenPrintingEnabled: value })}
      />
      {form.kitchenPrintingEnabled && (
        <div className="mt-3">
          <label className="text-xs font-bold text-secondary block mb-1">Kitchen printer</label>
          <select
            value={form.kitchenPrinterName}
            onChange={(e) => setForm({ ...form, kitchenPrinterName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#DCDCDC] text-sm bg-white focus:outline-none focus:border-primary-500"
          >
            <option value="">System default printer</option>
            {printers.map((printer) => (
              <option key={printer.name} value={printer.name}>
                {printer.name}
                {printer.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Printers are read from this computer — set the kitchen printer up in Windows first.
          </p>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-8 px-8 py-3 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-900 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}

export default StoreSettingsPanel
