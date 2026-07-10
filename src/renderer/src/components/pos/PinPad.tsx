import { useState } from 'react'
import { FaBackspace } from 'react-icons/fa'

/**
 * Touch-first numeric PIN pad used for cashier login and supervisor approvals.
 * Auto-submits at 4-6 digits via the Enter key (✓).
 */
function PinPad({
  onSubmit,
  busy = false
}: {
  onSubmit: (pin: string) => void
  busy?: boolean
}): JSX.Element {
  const [pin, setPin] = useState('')

  const press = (digit: string): void => {
    if (pin.length >= 6) return
    setPin(pin + digit)
  }

  const submit = (): void => {
    if (pin.length >= 4 && !busy) {
      onSubmit(pin)
      setPin('')
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="w-full max-w-[260px] mx-auto">
      <div className="flex justify-center items-center h-9 mb-4 gap-2.5">
        {pin.length === 0 ? (
          <span className="text-muted text-sm">Enter PIN</span>
        ) : (
          Array.from(pin).map((_, i) => (
            <span key={i} className="w-3 h-3 rounded-full bg-primary-700 inline-block" />
          ))
        )}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => press(key)}
            className="h-14 rounded-control bg-white border border-line text-ink text-xl font-semibold hover:bg-app active:bg-line transition-colors"
          >
            {key}
          </button>
        ))}
        <button
          onClick={() => setPin(pin.slice(0, -1))}
          className="h-14 rounded-control bg-white border border-line text-muted flex items-center justify-center hover:bg-app hover:text-ink transition-colors"
        >
          <FaBackspace />
        </button>
        <button
          onClick={() => press('0')}
          className="h-14 rounded-control bg-white border border-line text-ink text-xl font-semibold hover:bg-app active:bg-line transition-colors"
        >
          0
        </button>
        <button
          onClick={submit}
          disabled={pin.length < 4 || busy}
          className="h-14 rounded-control bg-primary-700 text-white text-xl font-bold hover:bg-primary-800 disabled:opacity-40 transition-colors"
        >
          ✓
        </button>
      </div>
    </div>
  )
}

export default PinPad
