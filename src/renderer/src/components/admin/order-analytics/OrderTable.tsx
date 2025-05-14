import { AiFillCaretDown, AiFillCaretRight } from "react-icons/ai";
import { useState } from "react";
import { Order } from "@renderer/types/order"

export default function OrderTable({ onSelectOrder, orders, fetchMoreOrders }: {
  onSelectOrder: (order: any) => void, orders: {
    rows: Order[], totalRows: number,
    limit: number,
    totalPages: number,
    page: number,
    pagingCounter: number,
    hasPrevPage: boolean,
    hasNextPage: boolean,
    prevPage: number | null,
    nextPage: number | null
  }, fetchMoreOrders: (page: number) => void
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  

  const handleOrderClick = (order: any) => {
    if (selectedOrderId === order.id) {
      setSelectedOrderId(null);
      onSelectOrder(null);
    } else {
      setSelectedOrderId(order.id);
      onSelectOrder(order);
    }
    console.log(orders)
  };

  return (
    <>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 border-b shadow-sm">
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
                <tbody className="divide-y divide-gray-200 bg-white py-4">
                  {orders.rows.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className={`cursor-pointer ${selectedOrderId === order.id ? 'bg-gray-100' : ''}`}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="flex space-x-3 items-center justify-between">
                            {selectedOrderId === order.id ? (
                              <AiFillCaretRight className="text-secondary" />
                            ) : (
                              <AiFillCaretDown className="text-secondary" />
                            )}
                            <p className="font-bold text-base- text-secondary">
                              #{order.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.groups.length}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString("en-US", {
                          month: "numeric",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ₦{order.total.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.payments.map((payment, index) => (
                          <div key={index} className="flex justify-evenly space-x-2 items-center">
                            <span>{payment.paymentMethod}</span>
                          </div>
                        ))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.specialOrder ? (
                          <span className="text-yellow-800 bg-yellow-100 rounded-md p-1 text-xs">
                            Special Order
                          </span>
                        ) : (
                          <span className="text-[#7b7b7b]  rounded-md p-1 text-xs">
                            Nil
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.backupStatus ? (
                          <span className="text-[#01A920] bg-[#DDFFFC] rounded-md p-1 text-xs">
                            True
                          </span>
                        ) : (
                          <span className="text-[#FD0002] bg-[#F5E6E8] rounded-md p-1 text-xs">
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
          onClick={() => { fetchMoreOrders(orders.prevPage) }}
          disabled={!orders.hasPrevPage}
          className="px-4 py-2 border rounded-md disabled:bg-gray-100"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {orders.page} of {orders.totalPages}
        </span>
        <button
          onClick={() => { fetchMoreOrders(orders.nextPage) }}
          disabled={!orders.hasNextPage}
          className="px-4 py-2 border rounded-md disabled:bg-gray-100"
        >
          Next
        </button>
      </div>
    </>
  );
}