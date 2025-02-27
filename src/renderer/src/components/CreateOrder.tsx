/* eslint-disable react/display-name */
import { CgSpinner } from 'react-icons/cg'
import { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaPlus } from 'react-icons/fa'
import { forwardRef, useImperativeHandle } from 'react'
import ShoppingBag from '@renderer/assets/images/shopping-bags.svg'
import { ordersApi, utilsApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import { PaymentMethodManager } from './PaymentMethodManager'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  foodName: string
  quantity: number
  price: number
  amount: number
}

interface OrderGroup {
  items: OrderItem[]
  total: number
}

const CreateOrder = forwardRef(({ onOrderUpdate }, ref) => {
  const [groups, setGroups] = useState<OrderGroup[]>([{ items: [], total: 0 }])
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [openGroups, setOpenGroups] = useState(new Set([0]))
  const [paymentMethods, setPaymentMethods] = useState<Payment[]>([])
  const [createdOrder, setCreatedOrder] = useState(null)

  const [isPaid, setIsPaid] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)

  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  const handleAccordionClick = (index: number) => {
    // Toggle accordion open/close
    toggleGroup(index)
    // Set as active group
    setActiveGroupIndex(index)
    // Notify parent component of active group change
    onOrderUpdate?.(groups, index)
  }

  useImperativeHandle(ref, () => ({
    addItemToGroup: (food) => addItemToGroup(food)
  }))

  const addItemToGroup = (food) => {
    setGroups((prevGroups) => {
      const newGroups = [...prevGroups]
      const group = newGroups[activeGroupIndex]

      // Check if item already exists in the group
      const existingItem = group.items.find((item) => item.id === food.id)

      if (!existingItem) {
        group.items.push({
          id: food.id,
          foodName: food.name,
          quantity: 1,
          price: food.price,
          amount: food.price,
        })
        group.total = group.items.reduce((sum, item) => sum + item.amount, 0)
      }

      return newGroups
    })
  }

  const updateItemQuantity = (groupIndex, itemId, newQuantity) => {
    setGroups((prevGroups) => {
      const newGroups = [...prevGroups]
      const group = newGroups[groupIndex]

      if (newQuantity === 0) {
        // Remove item and notify parent
        group.items = group.items.filter((item) => item.id !== itemId)
        onOrderUpdate?.(newGroups, groupIndex, itemId) // Add itemId to callback

        if (groupIndex !== 0 && group.items.length === 0) {
          newGroups.splice(groupIndex, 1)
          setActiveGroupIndex((prev) => (prev > groupIndex ? prev - 1 : prev))
        }
      } else {
        const item = group.items.find((item) => item.id === itemId)
        if (item) {
          item.quantity = newQuantity
          item.amount = item.quantity * item.price
        }
      }

      group.total = group.items.reduce((sum, item) => sum + item.amount, 0)
      return newGroups
    })
  }
  const createNewGroup = () => {
    setGroups((prev) => [...prev, { items: [], total: 0 }])
    const newIndex = groups.length
    setActiveGroupIndex(newIndex)
    setOpenGroups((prev) => new Set(prev).add(newIndex))
    onOrderUpdate?.(groups, newIndex)
  }

  const setActiveGroup = (index) => {
    setActiveGroupIndex(index)
    onOrderUpdate?.(groups, index)
  }
  const toggleGroup = (index: number) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const getTotalOrderAmount = () => {
    return groups.reduce((sum, group) => sum + group.total, 0)
  }

  const arePaymentsValid = () => {
    if (paymentMethods.length === 0) return false

    const totalPaymentAmount = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0)
    return totalPaymentAmount === getTotalOrderAmount()
  }


  const clearOrder = () => {
    setGroups([{ items: [], total: 0 }])
    setActiveGroupIndex(0)
    setOpenGroups(new Set([0]))
    onOrderUpdate?.([{ items: [], total: 0 }], 0)
    setIsPaid(false)
  }

  const handleCreateOrder = async () => {
    try {

      const orderData = {
        payments: paymentMethods,
        total: getTotalOrderAmount(),
        groups
      }
      setIsCreatingOrder(true)

      const totalPaymentAmount = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0)
      if (totalPaymentAmount !== getTotalOrderAmount()) {
        throw new Error('Payment amount does not match order total')
      }


      const baseUrl = `http://${host}:${port}/api`
      const response = await ordersApi.create(baseUrl, orderData)

      response.data.createdAt = response.data.createdAt + 'Z'

      setCreatedOrder(response.data)
      setIsPaid(true)
    } catch (error) {
      toast.error(error.message);
      console.error('Error Creating Order', error)
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handlePrintReceipt = async () => {
    setIsPrintingReceipt(true)
    try {
      await utilsApi.printReceipt(createdOrder)
    } catch (error) {
      console.error('Error Creating Order', error)
    } finally {
      setIsPrintingReceipt(false)
    }
  }

  return (
    <>
      {groups[0].items.length === 0 && groups.length === 1 ? (
        <>
          <h2 className="text-lg font-bold text-secondary mb-4 border-b border-[7474746B]">
            Order Details
          </h2>
          <div className="bg-[#F5F5F5] border-[#7474748F] rounded-2xl flex items-center justify-center flex-col py-20 px-28  border-dashed border-2 space-y-4 h-full">
            <img src={ShoppingBag} alt="Shopping bag" width={100} />
            <h1 className="text-center text-secondary">No order yet!</h1>
          </div>
        </>
      ) : (
        <div className="w-full max-h-[100vh] bg-gray-100 p-5 rounded-lg flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={createNewGroup}
              className="px-4 py-2 bg-primary-700 text-white rounded-lg flex items-center cursor-pointer"
            >
              <FaPlus className="mr-2" /> New Group
            </button>

            <button
              onClick={clearOrder}
              className="px-4 py-2 text-red-600 hover:text-red-700 font-medium flex items-center cursor-pointer"
            >
              Clear Order
            </button>
          </div>

          <div className="flex-grow overflow-auto">
            {groups.map((group, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm mb-3 ${index === activeGroupIndex ? 'border-2 border-primary-700' : ''
                  }`}
              >
                <button
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-200 rounded-lg"
                  onClick={() => handleAccordionClick(index)}
                >
                  <span className="font-bold">
                    {group.items.length} items - ₦{group.total.toLocaleString()}
                  </span>
                  {openGroups.has(index) ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {openGroups.has(index) && (
                  <div className="p-4" onClick={() => setActiveGroup(index)}>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b pb-2 mb-2"
                      >
                        <div>
                          <p className="text-sm text-gray-900 font-bold">
                            {item.foodName}{' '}
                            <span className="font-normal">- ₦{item.price.toLocaleString()}</span>
                          </p>
                          <p className="text-xs text-gray-900 font-bold">
                            <span className="font-normal">Total:</span>₦
                            {item.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemQuantity(index, item.id, item.quantity - 1)}
                            className="bg-primary-700 text-white w-8 h-8 rounded-md"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(index, item.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 text-center border rounded-md"
                          />
                          <button
                            onClick={() => updateItemQuantity(index, item.id, item.quantity + 1)}
                            className="bg-primary-700 text-white w-8 h-8 rounded-md"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg px-4 py-5 shadow-sm mt-auto">
            <PaymentMethodManager
              total={getTotalOrderAmount()}
              onPaymentsChange={(payments) => {
                // Store payments in state if needed
                setPaymentMethods(payments)
              }}
            />
            <div className="mt-4 text-sm">
              <div className="flex justify-between mt-2 border-t pt-2">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary-700">
                  Total: ₦{getTotalOrderAmount().toLocaleString()}
                </span>
              </div>
              {!isPaid && (
                <div className="mt-4">
                  <button
                    className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-700 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-blue-300 disabled:opacity-50 cursor-pointer`}
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || !arePaymentsValid()}
                  >
                    {isCreatingOrder ? <CgSpinner className="animate-spin text-2xl" /> : 'Paid'}
                  </button>
                </div>
              )}
              {isPaid && (
                <div className="mt-4 flex items-center justify-between space-x-3">
                  <button
                    className="group relative w-full flex justify-center p-2 text-sm font-medium rounded-lg text-primary-700 border-2 border-primary-700 hover:border-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 cursor-pointer"
                    onClick={clearOrder}
                  >
                    New Order
                  </button>
                  <button
                    className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white ${isPrintingReceipt ? 'bg-primary-500' : 'bg-primary-700'} hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 cursor-pointer`}
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
})

export default CreateOrder
