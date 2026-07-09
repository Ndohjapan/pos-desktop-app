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
      <div className="flex justify-center items-center h-10 mb-3 gap-2">
        {pin.length === 0 ? (
          <span className="text-gray-400 text-sm">Enter PIN</span>
        ) : (
          Array.from(pin).map((_, i) => (
            <span key={i} className="w-3 h-3 rounded-full bg-secondary inline-block" />
          ))
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => press(key)}
            className="py-4 rounded-lg bg-[#F5F5F5] text-secondary text-xl font-bold hover:bg-[#ECECEC] active:bg-[#e0e0e0]"
          >
            {key}
          </button>
        ))}
        <button
          onClick={() => setPin(pin.slice(0, -1))}
          className="py-4 rounded-lg bg-[#F5F5F5] text-secondary flex items-center justify-center hover:bg-[#ECECEC]"
        >
          <FaBackspace />
        </button>
        <button
          onClick={() => press('0')}
          className="py-4 rounded-lg bg-[#F5F5F5] text-secondary text-xl font-bold hover:bg-[#ECECEC]"
        >
          0
        </button>
        <button
          onClick={submit}
          disabled={pin.length < 4 || busy}
          className="py-4 rounded-lg bg-primary-700 text-white text-xl font-bold hover:bg-primary-900 disabled:opacity-40"
        >
          ✓
        </button>
      </div>
    </div>
  )
}

export default PinPad
