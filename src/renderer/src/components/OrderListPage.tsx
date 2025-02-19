//@ts-nocheck
'use client'

import React, { useEffect, useState } from 'react'
import OrderTable from './OrderTable'
import OrderDetails from './OrderDetails'
import { ordersApi, utilsApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import toast from 'react-hot-toast'

const ITEM_PER_PAGE = 10

const OrderTableSkeleton = () => (
  <div className="w-full mt-5">
    <div className="bg-gray-200 animate-pulse h-12 rounded-t-md mb-2"></div>
    {[...Array(5)].map((_, index) => (
      <div key={index} className="bg-gray-200 animate-pulse h-16 mb-2 rounded-sm"></div>
    ))}
  </div>
)

function OrderListPage() {
  const [orders, setOrders] = useState(null)
  const [order, setOrder] = useState(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [isSyncLoading, setIsSyncLoading] = useState(false)
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        const baseUrl = `http://${host}:${port}/api`
        const response = await ordersApi.getByDate(baseUrl, currentDate, 1, ITEM_PER_PAGE)
        console.log(response)
        setOrders(response.data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [currentDate])

  const handleBackupOrders = async () => {
    try {
      setIsBackupLoading(true)
      const baseUrl = `http://${host}:${port}/api`
      await utilsApi.backupOrders(baseUrl)
      toast.success('Orders backed up successfully!')
      fetchMoreOrders(1)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsBackupLoading(false)
    }
  }

  const handleSyncData = async () => {
    try {
      setIsSyncLoading(true)
      const baseUrl = `http://${host}:${port}/api`
      await utilsApi.syncData(baseUrl)
      toast.success('Inventory synced successfully!')
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsSyncLoading(false)
    }
  }

  const fetchMoreOrders = async (page: number) => {
    try {
      const baseUrl = `http://${host}:${port}/api`
      const response = await ordersApi.getByDate(baseUrl, currentDate, page, ITEM_PER_PAGE)
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching more orders:', error)
    }
  }

  return (
    <div className="md:grid md:grid-cols-12 w-full py-1 px-8 md:pl-8 mt-7">
      {/* Orders Table Section (70%) */}
      <div className="col-span-8 pr-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            <h1 className="text-xl font-bold text-secondary">Orders: </h1>
            <input
              type="date"
              name="date"
              id="date"
              defaultValue={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="ml-3 px-7 py-2 rounded-sm border border-[#DCDCDC] bg-[#F0F1F2] text-[#6B7280] text-xs"
            />
          </div>
          <div className="flex items-center justify-between space-x-3">
            <button
              onClick={handleBackupOrders}
              disabled={isBackupLoading}
              className={`group relative w-full flex justify-center p-2 text-sm font-medium rounded-lg
      ${
        isBackupLoading
          ? 'text-primary-400 border-2 border-primary-400 cursor-not-allowed'
          : 'text-primary-700 border-2 border-primary-700 hover:border-primary-900 cursor-pointer'
      }`}
            >
              {isBackupLoading ? 'Backing up...' : 'Backup Orders'}
            </button>
            <button
              onClick={handleSyncData}
              disabled={isSyncLoading}
              className={`min-w-[150px] flex justify-center p-2 border text-sm font-medium rounded-lg text-white
      ${
        isSyncLoading
          ? 'bg-primary-400 cursor-not-allowed'
          : 'bg-primary-700 hover:bg-primary-900 cursor-pointer'
      }`}
            >
              {isSyncLoading ? 'Updating...' : 'Update Inventory'}
            </button>
          </div>
        </div>

        {/* Order Table */}
        {ordersLoading ? (
          <>
            <OrderTableSkeleton />
          </>
        ) : (
          <>
            <OrderTable
              onSelectOrder={setOrder}
              orders={orders}
              fetchMoreOrders={fetchMoreOrders}
            />
          </>
        )}
      </div>

      {/* Order Details Section (30%) */}
      <div className="col-span-4 bg-white border-l border-[#DCDCDC]  pl-4">
        {order ? (
          <>
            <OrderDetails order={order} />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-secondary mb-4 border-b border-[7474746B]">
              Order Details
            </h2>
            <div className="h-full flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600">Select an order to see the details here</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderListPage
