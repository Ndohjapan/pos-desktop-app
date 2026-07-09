/* eslint-disable react/display-name */
import { CgSpinner } from 'react-icons/cg'
import { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaPlus, FaPause, FaTag } from 'react-icons/fa'
import { forwardRef, useImperativeHandle } from 'react'
import ShoppingBag from '@renderer/assets/images/shopping-bags.svg'
import { ordersApi, utilsApi } from '@renderer/api/client'
import { posApi } from '@renderer/api/pos'
import { useConnectionStore } from '@renderer/store/connection'
import { useCashierStore, useSettingsStore } from '@renderer/store/pos'
import { PaymentMethodManager } from './PaymentMethodManager'
import PinPad from './pos/PinPad'
import toast from 'react-hot-toast'
import type { CreateOrderInput, Food, Order, Payment } from '../types'
import { round2, sumMoney } from '@renderer/utils/money'

export interface DraftOrderItem {
  id: number
  foodName: string
  quantity: number
  price: number
  amount: number
}

export interface DraftOrderGroup {
  items: DraftOrderItem[]
  total: number
}

export interface CreateOrderHandle {
  addItemToGroup: (food: Food) => void
  // Resume a held order: replaces the current draft with the parked one.
  loadDraft: (groups: DraftOrderGroup[], parkedOrderId: number) => void
}

interface CreateOrderProps {
  onOrderUpdate?: (groups: DraftOrderGroup[], activeIndex: number, removedItemId?: number) => void
  showServiceFee?: boolean
}

const CreateOrder = forwardRef<CreateOrderHandle, CreateOrderProps>(
  ({ onOrderUpdate, showServiceFee = false }, ref) => {
    const [groups, setGroups] = useState<DraftOrderGroup[]>([{ items: [], total: 0 }])
    const [activeGroupIndex, setActiveGroupIndex] = useState(0)
    const [openGroups, setOpenGroups] = useState(new Set([0]))
    const [paymentMethods, setPaymentMethods] = useState<Payment[]>([])
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
    const [serviceFee, setServiceFee] = useState(0)

    const [isPaid, setIsPaid] = useState(false)
    const [isCreatingOrder, setIsCreatingOrder] = useState(false)
    const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)

    // Hold / resume
    const [resumedParkedId, setResumedParkedId] = useState<number | null>(null)
    const [holdPromptOpen, setHoldPromptOpen] = useState(false)
    const [holdLabel, setHoldLabel] = useState('')
    const [isHolding, setIsHolding] = useState(false)

    // Discount (supervisor-approved)
    const [discount, setDiscount] = useState(0)
    const [discountReason, setDiscountReason] = useState('')
    const [supervisorPin, setSupervisorPin] = useState('')
    const [discountPromptOpen, setDiscountPromptOpen] = useState(false)
    const [pendingDiscount, setPendingDiscount] = useState('')
    const [pendingReason, setPendingReason] = useState('')
    const [pinModalOpen, setPinModalOpen] = useState(false)

    // Cash handling
    const [tendered, setTendered] = useState('')

    const host = useConnectionStore((state) => state.host)
    const port = useConnectionStore((state) => state.port)
    const settings = useSettingsStore((state) => state.settings)
    const cashier = useCashierStore((state) => state.cashier)
    const shift = useCashierStore((state) => state.shift)

    const handleAccordionClick = (index: number): void => {
      toggleGroup(index)
      setActiveGroupIndex(index)
      onOrderUpdate?.(groups, index)
    }

    useImperativeHandle(ref, () => ({
      addItemToGroup: (food: Food) => addItemToGroup(food),
      loadDraft: (draftGroups: DraftOrderGroup[], parkedOrderId: number) => {
        setGroups(draftGroups.length ? draftGroups : [{ items: [], total: 0 }])
        setActiveGroupIndex(0)
        setOpenGroups(new Set(draftGroups.map((_, index) => index)))
        setResumedParkedId(parkedOrderId)
        setIsPaid(false)
        setCreatedOrder(null)
        onOrderUpdate?.(draftGroups, 0)
      }
    }))

    const addItemToGroup = (food: Food): void => {
      setGroups((prevGroups) => {
        const newGroups = [...prevGroups]
        const group = newGroups[activeGroupIndex]

        const existingItem = group.items.find((item) => item.id === food.id)

        if (!existingItem) {
          group.items.push({
            id: food.id,
            foodName: food.name,
            quantity: 1,
            price: food.price,
            amount: round2(food.price)
          })
          group.total = sumMoney(group.items.map((it) => it.amount))
        }

        return newGroups
      })
    }

    const updateItemQuantity = (groupIndex: number, itemId: number, newQuantity: number): void => {
      setGroups((prevGroups) => {
        const newGroups = [...prevGroups]
        const group = newGroups[groupIndex]

        if (newQuantity === 0) {
          group.items = group.items.filter((item) => item.id !== itemId)
          onOrderUpdate?.(newGroups, groupIndex, itemId)

          if (groupIndex !== 0 && group.items.length === 0) {
            newGroups.splice(groupIndex, 1)
            setActiveGroupIndex((prev) => (prev > groupIndex ? prev - 1 : prev))
          }
        } else {
          const item = group.items.find((item) => item.id === itemId)
          if (item) {
            item.quantity = newQuantity
            item.amount = round2(item.quantity * item.price)
          }
        }

        group.total = sumMoney(group.items.map((it) => it.amount))
        return newGroups
      })
    }
    const createNewGroup = (): void => {
      setGroups((prev) => [...prev, { items: [], total: 0 }])
      const newIndex = groups.length
      setActiveGroupIndex(newIndex)
      setOpenGroups((prev) => new Set(prev).add(newIndex))
      onOrderUpdate?.(groups, newIndex)
    }

    const setActiveGroup = (index: number): void => {
      setActiveGroupIndex(index)
      onOrderUpdate?.(groups, index)
    }
    const toggleGroup = (index: number): void => {
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

    const getSubtotalAmount = (): number => {
      return sumMoney(groups.map((group) => group.total))
    }

    const getTotalOrderAmount = (): number => {
      const subtotal = getSubtotalAmount()
      const withFee = showServiceFee ? round2(subtotal + serviceFee) : subtotal
      return round2(Math.max(0, withFee - discount))
    }

    const handleServiceFeeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = round2(parseFloat(e.target.value) || 0)
      setServiceFee(value)
    }

    const arePaymentsValid = (): boolean => {
      if (paymentMethods.length === 0) return false

      const totalPaymentAmount = sumMoney(paymentMethods.map((p) => p.amount))
      return totalPaymentAmount === getTotalOrderAmount()
    }

    // Cash handling: how much of the total is being settled in cash, what the
    // customer handed over, and the change owed.
    const cashPortion = round2(
      paymentMethods
        .filter((p) => p.paymentMethod.toLowerCase() === 'cash')
        .reduce((sum, p) => sum + p.amount, 0)
    )
    const tenderedAmount = round2(parseFloat(tendered) || 0)
    const changeDue = tendered === '' ? 0 : round2(Math.max(0, tenderedAmount - cashPortion))
    const tenderedTooLow = tendered !== '' && tenderedAmount < cashPortion

    const clearOrder = (): void => {
      setGroups([{ items: [], total: 0 }])
      setActiveGroupIndex(0)
      setOpenGroups(new Set([0]))
      setServiceFee(0)
      setDiscount(0)
      setDiscountReason('')
      setSupervisorPin('')
      setTendered('')
      setResumedParkedId(null)
      onOrderUpdate?.([{ items: [], total: 0 }], 0)
      setIsPaid(false)
    }

    // Park the current draft under a label and clear the register for the
    // next customer. The draft is stored server-side so it survives restarts
    // and can be resumed from any till.
    const handleHold = async (): Promise<void> => {
      try {
        setIsHolding(true)
        // Re-parking a resumed order: replace the old parked copy.
        if (resumedParkedId) {
          await posApi.deleteParked(resumedParkedId).catch(() => undefined)
        }
        await posApi.parkOrder({
          label: holdLabel.trim() || `Order ${new Date().toLocaleTimeString()}`,
          cashierId: cashier?.id ?? null,
          cashierName: cashier?.fullName ?? null,
          payload: { groups }
        })
        toast.success('Order held — resume it anytime from the Held bar')
        setHoldPromptOpen(false)
        setHoldLabel('')
        clearOrder()
        window.dispatchEvent(new Event('parked-orders-changed'))
      } catch {
        // toast shown by api layer
      } finally {
        setIsHolding(false)
      }
    }

    const handleCreateOrder = async (): Promise<void> => {
      try {
        const orderData: CreateOrderInput = {
          payments: paymentMethods,
          total: getTotalOrderAmount(),
          subTotal: getSubtotalAmount(),
          serviceFee: showServiceFee ? serviceFee : 0,
          specialOrder: showServiceFee ? 1 : 0,
          groups,
          cashierId: cashier?.id,
          cashierName: cashier?.fullName,
          shiftId: shift?.id,
          discount: discount > 0 ? discount : undefined,
          discountReason: discount > 0 ? discountReason : undefined,
          supervisorPin: discount > 0 ? supervisorPin : undefined,
          tendered: tenderedAmount > 0 ? tenderedAmount : undefined,
          changeDue: changeDue > 0 ? changeDue : undefined,
          parkedOrderId: resumedParkedId ?? undefined
        }
        setIsCreatingOrder(true)

        const totalPaymentAmount = sumMoney(paymentMethods.map((p) => p.amount))
        if (totalPaymentAmount !== getTotalOrderAmount()) {
          throw new Error('Payment amount does not match order total')
        }
        if (tenderedTooLow) {
          throw new Error('Cash tendered is less than the cash amount due')
        }

        const baseUrl = `http://${host}:${port}/api`
        const response = await ordersApi.create(baseUrl, orderData)

        response.data.createdAt = response.data.createdAt + 'Z'

        setCreatedOrder(response.data)
        setIsPaid(true)
        if (resumedParkedId) {
          setResumedParkedId(null)
          window.dispatchEvent(new Event('parked-orders-changed'))
        }

        // Fire the kitchen slip automatically the moment the order is paid.
        if (settings.quickService && settings.kitchenPrintingEnabled) {
          window.api
            .printKitchenTicket(response.data, settings.kitchenPrinterName || undefined)
            .catch(() => toast.error('Kitchen ticket failed to print'))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create order')
        console.error('Error Creating Order', error)
      } finally {
        setIsCreatingOrder(false)
      }
    }

    const handlePrintReceipt = async (): Promise<void> => {
      if (!createdOrder) return
      setIsPrintingReceipt(true)
      try {
        await utilsApi.printReceipt(createdOrder)
      } catch (error) {
        console.error('Error Printing Receipt', error)
      } finally {
        setIsPrintingReceipt(false)
      }
    }

    const hasItems = groups.some((group) => group.items.length > 0)

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
                className="px-3 py-2 bg-primary-700 text-white rounded-lg flex items-center cursor-pointer text-sm"
              >
                <FaPlus className="mr-2" /> New Group
              </button>

              <div className="flex items-center gap-1">
                {hasItems && !isPaid && (
                  <button
                    onClick={() => setHoldPromptOpen(true)}
                    className="px-3 py-2 text-secondary hover:text-primary-700 font-medium flex items-center cursor-pointer text-sm"
                    title="Hold this order and serve the next customer"
                  >
                    <FaPause className="mr-1" /> Hold
                  </button>
                )}
                <button
                  onClick={clearOrder}
                  className="px-3 py-2 text-red-600 hover:text-red-700 font-medium flex items-center cursor-pointer text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-auto">
              {groups.map((group, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-sm mb-3 ${
                    index === activeGroupIndex ? 'border-2 border-primary-700' : ''
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
              {isPaid && createdOrder ? (
                <div className="text-center mb-3">
                  <p className="text-xs text-gray-500">Order number</p>
                  <p className="text-5xl font-extrabold text-primary-700 leading-tight">
                    #{String(createdOrder.orderNumber || createdOrder.id).padStart(3, '0')}
                  </p>
                  {createdOrder.changeDue > 0 && (
                    <p className="mt-1 text-lg font-bold text-[#01A920]">
                      Change: ₦{createdOrder.changeDue.toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <PaymentMethodManager
                  total={getTotalOrderAmount()}
                  onPaymentsChange={(payments) => {
                    setPaymentMethods(payments)
                  }}
                />
              )}

              {/* Cash tendered / change — shown when part of the payment is cash */}
              {!isPaid && cashPortion > 0 && (
                <div className="mt-3 p-3 bg-[#F6FFF6] border border-[#CDEACD] rounded-lg text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-secondary">Cash received</span>
                    <div className="flex items-center gap-1">
                      <span>₦</span>
                      <input
                        type="number"
                        min="0"
                        value={tendered}
                        onChange={(e) => setTendered(e.target.value)}
                        placeholder={String(cashPortion)}
                        className={`w-28 text-right border rounded-md p-1 ${tenderedTooLow ? 'border-[#FD0002]' : ''}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 font-bold">
                    <span>Change</span>
                    <span className={tenderedTooLow ? 'text-[#FD0002]' : 'text-[#01A920]'}>
                      {tenderedTooLow ? 'Not enough cash' : `₦${changeDue.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm">
                <div className="flex justify-between mt-2 border-t pt-2">
                  <span className="font-bold">Subtotal</span>
                  <span className="font-bold">₦{getSubtotalAmount().toLocaleString()}</span>
                </div>

                {showServiceFee && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold">Service Fee</span>
                    <div className="flex items-center">
                      <span className="mr-2">₦</span>
                      <input
                        type="number"
                        min="0"
                        value={serviceFee}
                        onChange={handleServiceFeeChange}
                        className="w-24 text-right border rounded-md p-1"
                      />
                    </div>
                  </div>
                )}

                {!isPaid && (
                  <div className="flex justify-between items-center mt-2">
                    {discount > 0 ? (
                      <>
                        <span className="font-bold text-[#FD0002] flex items-center gap-1">
                          <FaTag /> Discount ({discountReason})
                        </span>
                        <span className="font-bold text-[#FD0002]">
                          -₦{discount.toLocaleString()}
                          <button
                            onClick={() => {
                              setDiscount(0)
                              setDiscountReason('')
                              setSupervisorPin('')
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Remove discount"
                          >
                            &times;
                          </button>
                        </span>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setPendingDiscount('')
                          setPendingReason('')
                          setDiscountPromptOpen(true)
                        }}
                        className="text-xs text-primary-700 underline flex items-center gap-1"
                      >
                        <FaTag /> Add discount (needs supervisor)
                      </button>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-2 border-t pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary-700">
                    ₦{getTotalOrderAmount().toLocaleString()}
                  </span>
                </div>

                {!isPaid && (
                  <div className="mt-4">
                    <button
                      className={`group relative w-full flex justify-center p-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-700 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-blue-300 disabled:opacity-50 cursor-pointer`}
                      onClick={handleCreateOrder}
                      disabled={isCreatingOrder || !arePaymentsValid() || tenderedTooLow}
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

        {/* Hold prompt */}
        {holdPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/60">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-secondary">Hold order</h2>
                <button
                  onClick={() => setHoldPromptOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  &times;
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Give it a name so you can find it again (e.g. customer&apos;s name)
              </p>
              <input
                value={holdLabel}
                onChange={(e) => setHoldLabel(e.target.value)}
                placeholder="e.g. Mama Tosin"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-[#DCDCDC] focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleHold}
                disabled={isHolding}
                className="mt-3 w-full py-2 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-900 disabled:opacity-50"
              >
                {isHolding ? 'Holding…' : 'Hold Order'}
              </button>
            </div>
          </div>
        )}

        {/* Discount prompt (amount + reason), then supervisor PIN */}
        {discountPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/60">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-secondary">Discount</h2>
                <button
                  onClick={() => setDiscountPromptOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  &times;
                </button>
              </div>
              <label className="text-xs font-bold text-secondary block mb-1">Amount (₦)</label>
              <input
                type="number"
                min="0"
                value={pendingDiscount}
                onChange={(e) => setPendingDiscount(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-[#DCDCDC] focus:outline-none focus:border-primary-500"
              />
              <label className="text-xs font-bold text-secondary block mb-1 mt-3">Reason</label>
              <input
                value={pendingReason}
                onChange={(e) => setPendingReason(e.target.value)}
                placeholder="e.g. customer complaint"
                className="w-full px-3 py-2 rounded-lg border border-[#DCDCDC] focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={() => {
                  const amount = round2(parseFloat(pendingDiscount) || 0)
                  if (amount <= 0) {
                    toast.error('Enter a discount amount')
                    return
                  }
                  if (amount >= getSubtotalAmount() + (showServiceFee ? serviceFee : 0)) {
                    toast.error('Discount cannot be the whole order')
                    return
                  }
                  if (!pendingReason.trim()) {
                    toast.error('A reason is required')
                    return
                  }
                  setDiscountPromptOpen(false)
                  setPinModalOpen(true)
                }}
                className="mt-4 w-full py-2 rounded-lg bg-primary-700 text-white font-bold hover:bg-primary-900"
              >
                Continue — supervisor approval
              </button>
            </div>
          </div>
        )}

        {pinModalOpen && (
          <SupervisorPinModalWithPin
            context={`discount ₦${pendingDiscount}`}
            onApproved={(pin) => {
              setDiscount(round2(parseFloat(pendingDiscount) || 0))
              setDiscountReason(pendingReason.trim())
              setSupervisorPin(pin)
              setPinModalOpen(false)
              toast.success('Discount approved')
            }}
            onCancel={() => setPinModalOpen(false)}
          />
        )}
      </>
    )
  }
)

/**
 * Discount approval needs the raw PIN (it is re-verified server-side when the
 * order is created, so the discount cannot be forged by a modified client).
 * This wraps the shared modal but returns the PIN after verifying it once.
 */
function SupervisorPinModalWithPin({
  context,
  onApproved,
  onCancel
}: {
  context: string
  onApproved: (pin: string) => void
  onCancel: () => void
}): JSX.Element {
  const [busy, setBusy] = useState(false)

  const handlePin = async (pin: string): Promise<void> => {
    try {
      setBusy(true)
      await posApi.verifySupervisor(pin, context)
      onApproved(pin)
    } catch {
      // toast shown by api layer
    } finally {
      setBusy(false)
    }
  }

  return (
    <PinModalShell title="Supervisor approval" onCancel={onCancel} onPin={handlePin} busy={busy} />
  )
}

function PinModalShell({
  title,
  onCancel,
  onPin,
  busy
}: {
  title: string
  onCancel: () => void
  onPin: (pin: string) => void
  busy: boolean
}): JSX.Element {
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
        <PinPad onSubmit={onPin} busy={busy} />
      </div>
    </div>
  )
}

export default CreateOrder
