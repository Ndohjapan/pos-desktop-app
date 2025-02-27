import { useState, useEffect } from 'react'
import { IoIosSend } from 'react-icons/io'
import { TbWorld } from 'react-icons/tb'
import { HiOutlineCash } from 'react-icons/hi'
import { FaCreditCard } from 'react-icons/fa'


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
    if (payments.find(p => p.paymentMethod === paymentMethod)) return

    const newPayment = {
      paymentMethod,
      amount: remainingAmount
    }

    const updatedPayments = [...payments, newPayment]
    setPayments(updatedPayments)
    onPaymentsChange(updatedPayments)
  }

  const handleAmountChange = (method: string, amount: number) => {
    const updatedPayments = payments.map(p =>
      p.paymentMethod === method ? { ...p, amount } : p
    )
    setPayments(updatedPayments)
    onPaymentsChange(updatedPayments)
  }

  const removePaymentMethod = (method: string) => {
    const updatedPayments = payments.filter(p => p.paymentMethod !== method)
    setPayments(updatedPayments)
    onPaymentsChange(updatedPayments)
  }

  return (
    <div>
      <h3 className="text-secondary text-xs font-semibold mb-2">Payment methods:</h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {PAYMENT_METHODS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => handleMethodSelect(name)}
            className={`border rounded-lg p-3 flex flex-col items-center ${payments.some(p => p.paymentMethod === name)
              ? 'bg-blue-100 border-blue-500'
              : 'bg-gray-100 border-gray-300'
              }`}
          >
            <Icon className="text-secondary text-lg" />
            <span className="text-xs mt-1">{name}</span>
          </button>
        ))}
      </div>

      {payments.map(({ paymentMethod, amount }) => (
        <div key={paymentMethod} className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{paymentMethod}</span>
            <button
              onClick={() => removePaymentMethod(paymentMethod)}
              className="text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={amount || ''} // This change will remove the sticky zero
              onChange={(e) => handleAmountChange(paymentMethod, Number(e.target.value))}
              className="w-full p-2 border rounded"
              max={total}
            />

          </div>
        </div>
      ))}

      <div className="mt-2 text-sm font-medium">
        <div className="flex justify-between text-gray-600">
          <span>Remaining:</span>
          <span>₦{remainingAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
