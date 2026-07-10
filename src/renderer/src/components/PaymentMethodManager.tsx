import { useState, useEffect } from 'react'
import { IoIosSend } from 'react-icons/io'
import { TbWorld } from 'react-icons/tb'
import { HiOutlineCash } from 'react-icons/hi'
import { FaCreditCard } from 'react-icons/fa'
import type { Payment } from '../types'

interface PaymentMethodManagerProps {
  total: number
  onPaymentsChange: (payments: Payment[]) => void
}

const PAYMENT_METHODS = [
  { name: 'Cash', icon: HiOutlineCash },
  { name: 'Card', icon: FaCreditCard },
  { name: 'Transfer', icon: IoIosSend },
  { name: 'Online', icon: TbWorld }
]

export const PaymentMethodManager = ({ total, onPaymentsChange }: PaymentMethodManagerProps) => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [remainingAmount, setRemainingAmount] = useState(total)

  useEffect(() => {
    setRemainingAmount(total - payments.reduce((sum, p) => sum + p.amount, 0))
  }, [payments, total])

  const handleMethodSelect = (paymentMethod: string) => {
    if (payments.find((p) => p.paymentMethod === paymentMethod)) return

    const newPayment = {
      paymentMethod,
      amount: remainingAmount
    }

    const updatedPayments = [...payments, newPayment]
    setPayments(updatedPayments)
    onPaymentsChange(updatedPayments)
  }

  const handleAmountChange = (method: string, amount: number) => {
    const updatedPayments = payments.map((p) => (p.paymentMethod === method ? { ...p, amount } : p))
    setPayments(updatedPayments)
    onPaymentsChange(updatedPayments)
  }

  const removePaymentMethod = (method: string) => {
    const updatedPayments = payments.filter((p) => p.paymentMethod !== method)
    setPayments(updatedPayments)
    onPaymentsChange(updatedPayments)
  }

  return (
    <div>
      <h3 className="text-ink text-xs font-semibold mb-2">Payment method</h3>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {PAYMENT_METHODS.map(({ name, icon: Icon }) => {
          const selected = payments.some((p) => p.paymentMethod === name)
          return (
            <button
              key={name}
              onClick={() => handleMethodSelect(name)}
              className={`rounded-control border p-2.5 flex flex-col items-center gap-1 transition-colors ${
                selected
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-line text-muted hover:border-primary-200 hover:text-ink'
              }`}
            >
              <Icon className="text-lg" />
              <span className="text-[11px] font-medium">{name}</span>
            </button>
          )
        })}
      </div>

      {payments.map(({ paymentMethod, amount }) => (
        <div key={paymentMethod} className="mb-2 p-3 rounded-control bg-app border border-line">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-ink">{paymentMethod}</span>
            <button
              onClick={() => removePaymentMethod(paymentMethod)}
              className="text-xs font-semibold text-danger-600 hover:text-danger-700"
            >
              Remove
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-muted text-sm">₦</span>
            <input
              type="text"
              value={amount || ''} // This change will remove the sticky zero
              onChange={(e) => handleAmountChange(paymentMethod, Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-500"
              max={total}
            />
          </div>
        </div>
      ))}

      <div className="mt-1 text-sm">
        <div className="flex justify-between text-muted">
          <span>Remaining</span>
          <span
            className={`font-semibold ${remainingAmount === 0 ? 'text-success-700' : 'text-ink'}`}
          >
            ₦{remainingAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
