import { AiFillCaretDown, AiFillCaretRight } from 'react-icons/ai'
import { useState } from 'react'
import { Order, PaginatedOrders } from '@renderer/types'

export default function OrderTable({
  onSelectOrder,
  orders,
  fetchMoreOrders
}: {
  onSelectOrder: (order: Order | null) => void
  orders: PaginatedOrders
  fetchMoreOrders: (page: number) => void
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const handleOrderClick = (order: Order) => {
    if (selectedOrderId === order.id) {
      setSelectedOrderId(null)
      onSelectOrder(null)
    } else {
      setSelectedOrderId(order.id)
      onSelectOrder(order)
    }
    console.log(orders)
  }

  return (
    <>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-app border-b shadow-sm">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-secondary sm:pl-6"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-secondary"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-secondary"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-secondary"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-secondary"
                    >
                      Payment Method
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-secondary"
                    >
                      Special Order
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-secondary"
                    >
                      Backup Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white py-4">
                  {orders.rows.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className={`cursor-pointer ${selectedOrderId === order.id ? 'bg-app' : ''}`}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="flex space-x-3 items-center justify-between">
                            {selectedOrderId === order.id ? (
                              <AiFillCaretRight className="text-secondary" />
                            ) : (
                              <AiFillCaretDown className="text-secondary" />
                            )}
                            <p className="font-bold text-base- text-secondary">#{order.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        {order.groups.length}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        {new Date(order.createdAt).toLocaleString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        ₦{order.total.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        {order.payments.map((payment, index) => (
                          <div key={index} className="flex justify-evenly space-x-2 items-center">
                            <span>{payment.paymentMethod}</span>
                          </div>
                        ))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        {order.specialOrder ? (
                          <span className="text-warning-700 bg-warning-50 rounded-md p-1 text-xs">
                            Special Order
                          </span>
                        ) : (
                          <span className="text-[#7b7b7b]  rounded-md p-1 text-xs">Nil</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        {order.backupStatus ? (
                          <span className="text-success-700 bg-success-50 rounded-md p-1 text-xs">
                            True
                          </span>
                        ) : (
                          <span className="text-danger-600 bg-danger-50 rounded-md p-1 text-xs">
                            False
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-4 gap-2">
        <button
          onClick={() => {
            if (orders.prevPage != null) fetchMoreOrders(orders.prevPage)
          }}
          disabled={!orders.hasPrevPage}
          className="px-4 py-2 border rounded-md disabled:bg-app"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {orders.page} of {orders.totalPages}
        </span>
        <button
          onClick={() => {
            if (orders.nextPage != null) fetchMoreOrders(orders.nextPage)
          }}
          disabled={!orders.hasNextPage}
          className="px-4 py-2 border rounded-md disabled:bg-app"
        >
          Next
        </button>
      </div>
    </>
  )
}
