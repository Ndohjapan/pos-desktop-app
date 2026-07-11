import { TbWorld } from 'react-icons/tb'
import { IoIosSend } from 'react-icons/io'
import { HiOutlineCash } from 'react-icons/hi'
import { useState } from 'react'
import { FaCreditCard, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { Order } from '@renderer/types/order'
import { utilsApi } from '@renderer/api/client'
import { posApi } from '@renderer/api/pos'
import { useCashierStore } from '@renderer/store/pos'
import PinPad from './pos/PinPad'
import toast from 'react-hot-toast'
import { CgSpinner } from 'react-icons/cg'

const OrderDetails = ({ order, onVoided }: { order: Order; onVoided?: () => void }) => {
  const [openGroups, setOpenGroups] = useState(new Set<number>())
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)
  const [voidPromptOpen, setVoidPromptOpen] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [voidPinOpen, setVoidPinOpen] = useState(false)
  const [voidBusy, setVoidBusy] = useState(false)
  const cashier = useCashierStore((state) => state.cashier)

  // Toggle function for accordions
  const toggleGroup = (groupIndex: number) => {
    setOpenGroups((prev) => {
      const newOpenGroups = new Set(prev)
      if (newOpenGroups.has(groupIndex)) {
        newOpenGroups.delete(groupIndex) // Close if already open
      } else {
        newOpenGroups.add(groupIndex) // Open if closed
      }
      return newOpenGroups
    })
  }

  const handlePrintReceipt = async () => {
    setIsPrintingReceipt(true)
    try {
      await utilsApi.printReceipt(order)
    } catch (error) {
      console.error('Error Creating Order', error)
    } finally {
      setIsPrintingReceipt(false)
    }
  }

  const handleVoidPin = async (pin: string): Promise<void> => {
    try {
      setVoidBusy(true)
      await posApi.voidOrder(order.id, voidReason.trim(), pin, cashier?.fullName)
      toast.success(`Order #${order.orderNumber || order.id} voided`)
      setVoidPinOpen(false)
      setVoidPromptOpen(false)
      setVoidReason('')
      onVoided?.()
    } catch {
      // toast shown by api layer
    } finally {
      setVoidBusy(false)
    }
  }

  const isVoided = order.status === 'voided'

  // Calculate subtotal if not provided directly
  const subtotal = order.subTotal || order.groups.reduce((sum, group) => sum + group.total, 0)
  const hasServiceCharge = order.serviceFee > 0

  return (
    <div className="w-full h-full max-h-[100vh] bg-app p-5 rounded-lg flex flex-col">
      {/* Order Header */}
      <div className="flex flex-col border-b pb-2 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary">
            Details{' '}
            <span className="text-secondary text-sm font-medium">
              ({order.groups.flat().length} items)
            </span>
          </h2>
          <p className="text-muted text-sm">Order #{order.id}</p>
        </div>
        <p className="text-center w-full text-secondary text-xs  mt-2">
          {new Date(order.createdAt).toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </p>

        {/* Display special order badge if applicable */}
        {order.specialOrder > 0 && (
          <div className="mt-2 text-center">
            <span className="bg-warning-50 text-warning-700 text-xs font-medium px-2.5 py-0.5 rounded">
              Special Order
            </span>
          </div>
        )}

        {isVoided && (
          <div className="mt-2 text-center">
            <span className="bg-danger-50 text-danger-600 text-xs font-bold px-2.5 py-0.5 rounded">
              VOIDED{order.voidReason ? ` — ${order.voidReason}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Order Groups with Accordion (Expands to Fill Space) */}
      <div className="flex-grow overflow-auto">
        {order.groups.map((group, groupIndex) => {
          const isOpen = openGroups.has(groupIndex)
          const totalItems = group.items.reduce((acc, item) => acc + item.quantity, 0)

          return (
            <div key={groupIndex} className="bg-white rounded-lg shadow-sm mb-3">
              {/* Accordion Header */}
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-200 rounded-lg text-ink text-sm font-semibold focus:outline-none"
                onClick={() => toggleGroup(groupIndex)}
              >
                <span>
                  {totalItems} items - ₦{group.total}
                </span>
                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {/* Accordion Content (Expanded) */}
              {isOpen && (
                <div className="p-4">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b pb-2 mb-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="text-xs text-secondary">
                            {item.foodName} - ₦{item.price.toLocaleString()}
                          </p>
                          <p className="text-ink text-sm font-bold">
                            - ₦{item.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-ink">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment Summary (Stays at Bottom) */}
      <div className="bg-white rounded-lg px-4 py-5 shadow-sm mt-auto">
        <h3 className="text-secondary text-xs font-semibold mb-2">Payment methods:</h3>

        {order.payments.map((payment, index) => (
          <div
            key={index}
            className="mb-2 border rounded-lg p-3 flex items-center justify-between bg-[#FBFFFF] border-[#012FA9]"
          >
            <div className="flex items-center space-x-2">
              {payment.paymentMethod.toLowerCase() === 'transfer' && (
                <IoIosSend className="text-secondary transform rotate-45 text-lg" />
              )}
              {payment.paymentMethod.toLowerCase() === 'online' && (
                <TbWorld className="text-secondary" />
              )}
              {payment.paymentMethod.toLowerCase() === 'card' && (
                <FaCreditCard className="text-secondary" />
              )}
              {payment.paymentMethod.toLowerCase() === 'cash' && (
                <HiOutlineCash className="text-secondary" />
              )}
              <span className="text-secondary text-xs">{payment.paymentMethod}</span>
            </div>
            <span className="text-secondary font-medium">₦{payment.amount.toLocaleString()}</span>
          </div>
        ))}

        <div className="mt-4 text-sm">
          <div className="flex items-center gap-2 mb-4">
            {!isVoided && (
              <button
                className="w-full flex justify-center p-2 text-sm font-medium rounded-lg text-danger-600 border-2 border-danger-500 hover:bg-[#FFF5F5] cursor-pointer"
                onClick={() => setVoidPromptOpen(true)}
              >
                Void Order
              </button>
            )}
            <button
              className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white ${isPrintingReceipt ? 'bg-primary-500' : 'bg-primary-700'} hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 cursor-pointer`}
              onClick={handlePrintReceipt}
              disabled={isPrintingReceipt}
            >
              {isPrintingReceipt ? (
                <CgSpinner className="animate-spin text-2xl" />
              ) : (
                'Print Receipt'
              )}
            </button>
          </div>

          {/* Order Summary Section */}
          <div className="border-t pt-2 space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">₦{subtotal.toLocaleString()}</span>
            </div>

            {/* Service Charge - only show if present */}
            {hasServiceCharge && (
              <div className="flex justify-between">
                <span className="text-muted">Service Charge</span>
                <span className="font-medium">₦{order.serviceFee.toLocaleString()}</span>
              </div>
            )}

            {/* Total - always show */}
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary-700">₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      {voidPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-secondary">
                Void order #{order.orderNumber || order.id}
              </h2>
              <button
                onClick={() => setVoidPromptOpen(false)}
                className="text-muted hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-muted mb-3">
              The order stays in history but is removed from sales totals.
            </p>
            <label className="text-xs font-bold text-secondary block mb-1">Reason</label>
            <input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. customer cancelled"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={() => {
                if (!voidReason.trim()) {
                  toast.error('A reason is required')
                  return
                }
                setVoidPinOpen(true)
              }}
              className="mt-4 w-full py-2 rounded-lg bg-danger-600 text-white font-bold hover:opacity-90"
            >
              Continue — supervisor approval
            </button>
          </div>
        </div>
      )}

      {voidPinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-secondary">Supervisor approval</h2>
              <button
                onClick={() => setVoidPinOpen(false)}
                className="text-muted hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-muted mb-4">
              A supervisor must enter their PIN to void this order.
            </p>
            <PinPad onSubmit={handleVoidPin} busy={voidBusy} />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetails
