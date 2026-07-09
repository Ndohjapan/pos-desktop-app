import { useState } from 'react'
import { posApi } from '@renderer/api/pos'
import type { CashierPublic } from '@renderer/types'
import PinPad from './PinPad'

/**
 * Supervisor approval gate for voids and discounts. Returns the approving
 * supervisor so the action can be attributed in the audit log.
 */
function SupervisorPinModal({
  title,
  context,
  onApproved,
  onCancel
}: {
  title: string
  context: string
  onApproved: (supervisor: CashierPublic) => void
  onCancel: () => void
}): JSX.Element {
  const [busy, setBusy] = useState(false)

  const handlePin = async (pin: string): Promise<void> => {
    try {
      setBusy(true)
      const { data: supervisor } = await posApi.verifySupervisor(pin, context)
      onApproved(supervisor)
    } catch {
      // toast shown by the api layer
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-secondary">{title}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-xl">
            &times;
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">A supervisor must enter their PIN to approve.</p>
        <PinPad onSubmit={handlePin} busy={busy} />
      </div>
    </div>
  )
}

export default SupervisorPinModal
