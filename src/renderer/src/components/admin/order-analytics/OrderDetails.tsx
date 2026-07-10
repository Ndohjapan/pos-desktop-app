import { TbWorld } from 'react-icons/tb'
import { IoIosSend } from 'react-icons/io'
import { HiOutlineCash } from 'react-icons/hi'
import { useState } from 'react'
import { FaCreditCard, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { Order } from '@renderer/types'
import { getAdminToken } from '@renderer/utils/auth'
import { ordersApi, utilsApi } from '@renderer/api/client'
import { CgSpinner } from 'react-icons/cg'
import { useConnectionStore } from '@renderer/store/connection'

const OrderDetails = ({ order, onDeleteOrder }: { order: Order; onDeleteOrder: () => void }) => {
  const [openGroups, setOpenGroups] = useState(new Set<number>())
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)
  const [isDeletingOrder, setIsDeletingOrder] = useState(false)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

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
      console.error('Error Printing Order', error)
    } finally {
      setIsPrintingReceipt(false)
    }
  }
  const handleDeleteOrder = async (orderId: number) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this order?')
    if (isConfirmed) {
      setIsDeletingOrder(true)
      try {
        const baseUrl = `http://${host}:${port}/api`
        await ordersApi.delete(baseUrl, orderId, getAdminToken())
        onDeleteOrder()
      } catch (error) {
        console.error('Error Deleting Order', error)
      } finally {
        setIsDeletingOrder(false)
      }
    }
  }

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
          <div className="flex items-center justify-between space-x-2">
            <button
              className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white ${isPrintingReceipt ? 'bg-danger-500' : 'bg-danger-600'} hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer mb-4`}
              onClick={() => {
                handleDeleteOrder(order.id)
              }}
              disabled={isDeletingOrder}
            >
              {isPrintingReceipt ? <CgSpinner className="animate-spin text-2xl" /> : 'Delete Order'}
            </button>
            <button
              // onClick={handlePrint}
              className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white ${isPrintingReceipt ? 'bg-primary-500' : 'bg-primary-700'} hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 cursor-pointer mb-4`}
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
    </div>
  )
}

export default OrderDetails
