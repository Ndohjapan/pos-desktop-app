import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { posApi } from '@renderer/api/pos'
import { useSettingsStore } from '@renderer/store/pos'
import Logo from '@renderer/assets/images/logo.svg'

interface Branch {
  branchId: string
  branchName: string
}

/**
 * One-time, first-run store picker for the Main machine. Cashiers choose the
 * store from a dropdown (no error-prone typing), it saves once, and never
 * appears again. The list comes from the cloud when reachable, else a built-in
 * fallback.
 */
function BranchSetupModal(): JSX.Element {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const setSettings = useSettingsStore((state) => state.setSettings)

  useEffect(() => {
    window.api
      .getAvailableBranches()
      .then((list) => {
        setBranches(list)
        if (list.length > 0) setSelected(list[0].branchId)
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (): Promise<void> => {
    const branch = branches.find((b) => b.branchId === selected)
    if (!branch) {
      toast.error('Please select a store')
      return
    }
    try {
      setSaving(true)
      const { data } = await posApi.setupBranch(branch.branchId, branch.branchName)
      setSettings(data)
      toast.success(`This computer is now set to ${branch.branchName}`)
    } catch {
      // toast shown by the api layer
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
      <img src={Logo} alt="Amala Oluyole" className="max-w-[140px] mb-4" />
      <h2 className="text-lg font-bold text-secondary">Which store is this computer in?</h2>
      <p className="text-xs text-gray-500 mb-5 max-w-sm text-center">
        Choose once during setup. Every sale from this computer is recorded under this store on the
        dashboard.
      </p>

      {loading ? (
        <div className="h-11 w-72 bg-gray-200 animate-pulse rounded-lg" />
      ) : (
        <div className="w-72">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-3 py-3 rounded-lg border border-[#DCDCDC] bg-white text-secondary focus:outline-none focus:border-primary-500"
          >
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.branchName}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full py-3 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-900 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Confirm store'}
          </button>
        </div>
      )}
    </div>
  )
}

export default BranchSetupModal
