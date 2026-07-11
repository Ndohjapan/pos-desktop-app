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
    <div className="overlay">
      <div className="card w-full max-w-sm p-6 shadow-elevated">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:bg-app hover:text-ink text-xl"
          >
            &times;
          </button>
        </div>
        <p className="text-xs text-muted mb-4">A supervisor must enter their PIN to approve.</p>
        <PinPad onSubmit={handlePin} busy={busy} />
      </div>
    </div>
  )
}

export default SupervisorPinModal
