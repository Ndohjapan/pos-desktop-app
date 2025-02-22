//@ts-nocheck
import { TbWorld } from 'react-icons/tb'
import { IoIosSend } from 'react-icons/io'
import { HiOutlineCash } from 'react-icons/hi'
import { useState } from 'react'
import { FaCreditCard, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { Order } from '@renderer/types/order'
import { utilsApi } from '@renderer/api/client'
import { CgSpinner } from 'react-icons/cg'

const OrderDetails = ({ order }: { order: Order }) => {
  const [openGroups, setOpenGroups] = useState(new Set())
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)

  // Toggle function for accordions
  const toggleGroup = (groupIndex) => {
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

  return (
    <div className="w-full h-full max-h-[100vh] bg-gray-100 p-5 rounded-lg flex flex-col">
      {/* Order Header */}
      <div className="flex flex-col border-b pb-2 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary">
            Details{' '}
            <span className="text-secondary text-sm font-medium">
              ({order.groups.flat().length} items)
            </span>
          </h2>
          <p className="text-gray-600 text-sm">Order #{order.id}</p>
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
      </div>

      {/* Order Groups with Accordion (Expands to Fill Space) */}
      <div className="flex-grow overflow-auto">
        {order.groups.map((group, groupIndex) => {
          const isOpen = openGroups.has(groupIndex)
          const totalItems = group.items.reduce((acc, item) => acc + item.quantity, 0)
          const totalPrice = group.items.reduce((acc, item) => acc + item.amount, 0)

          return (
            <div key={groupIndex} className="bg-white rounded-lg shadow-sm mb-3">
              {/* Accordion Header */}
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-200 rounded-lg text-gray-700 text-sm font-semibold focus:outline-none"
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
                          <p className="text-gray-700 text-sm font-bold">
                            - ₦{item.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-gray-700">{item.quantity}</span>
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
        <h3 className="text-secondary text-xs font-semibold mb-2">Payment method:</h3>
        <div className=" border rounded-lg p-3 flex flex-col items-center space-y-1 bg-[#FBFFFF] border-[#012FA9]">
          {order.paymentMethod.toLowerCase() === 'transfer' && (
            <IoIosSend className="text-secondary transform rotate-45 text-lg" />
          )}
          {order.paymentMethod.toLowerCase() === 'online' && <TbWorld className="text-secondary" />}
          {order.paymentMethod.toLowerCase() === 'card' && (
            <FaCreditCard className="text-secondary" />
          )}
          {order.paymentMethod.toLowerCase() === 'cash' && (
            <HiOutlineCash className="text-secondary" />
          )}
          <span className="text-secondary text-xs">{order.paymentMethod}</span>
        </div>

        <div className="mt-4 text-sm">
          <button
            // onClick={handlePrint}
            className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white ${isPrintingReceipt ? 'bg-primary-500' : 'bg-primary-700'} hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 cursor-pointer mb-4`}
            onClick={handlePrintReceipt}
            disabled={isPrintingReceipt}
          >
            {isPrintingReceipt ? <CgSpinner className="animate-spin text-2xl" /> : 'Print Receipt'}
          </button>
          <div className="flex justify-between border-t pt-2">
            <span className="font-bold">Total</span>
            <span className="font-bold text-primary-700">₦{order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
