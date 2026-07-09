import { useCallback, useEffect, useState } from 'react'
import OrderTable from './OrderTable'
import OrderDetails from './OrderDetails'
import { ordersApi, utilsApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import toast from 'react-hot-toast'
import type { Order, PaginatedOrders, SyncStatus } from '@renderer/types'

const ITEM_PER_PAGE = 50

const OrderTableSkeleton = () => (
  <div className="w-full mt-5">
    <div className="bg-gray-200 animate-pulse h-12 rounded-t-md mb-2"></div>
    {[...Array(5)].map((_, index) => (
      <div key={index} className="bg-gray-200 animate-pulse h-16 mb-2 rounded-sm"></div>
    ))}
  </div>
)

function Orders() {
  const [orders, setOrders] = useState<PaginatedOrders | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  const refreshSyncStatus = useCallback(async () => {
    try {
      const baseUrl = `http://${host}:${port}/api`
      const response = await utilsApi.getSyncStatus(baseUrl)
      setSyncStatus(response.data)
    } catch {
      // status is best-effort; ignore transient failures
    }
  }, [host, port])

  useEffect(() => {
    refreshSyncStatus()
    const interval = setInterval(refreshSyncStatus, 15000)
    return () => clearInterval(interval)
  }, [refreshSyncStatus])

  const handleRetryFailed = async () => {
    try {
      setIsRetrying(true)
      const baseUrl = `http://${host}:${port}/api`
      const result = await utilsApi.retryFailed(baseUrl)
      toast.success(`Re-queued ${result.data?.requeued ?? 0} order(s) for backup`)
      await utilsApi.backupOrders(baseUrl)
      await refreshSyncStatus()
    } catch (error) {
      console.error('Error retrying failed orders:', error)
    } finally {
      setIsRetrying(false)
    }
  }

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
      await refreshSyncStatus()
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsBackupLoading(false)
    }
  }

  const formatLastSync = (iso: string | null): string => {
    if (!iso) return 'never'
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

  const searchForOrder = async () => {
    try {
      const baseUrl = `http://${host}:${port}/api`

      // If search term is empty, fetch all orders for current date
      if (!searchTerm.trim()) {
        const response = await ordersApi.getByDate(baseUrl, currentDate, 1, ITEM_PER_PAGE)
        setOrders(response.data)
        return
      }

      const response = await ordersApi.searchByDate(
        baseUrl,
        currentDate,
        1,
        ITEM_PER_PAGE,
        searchTerm
      )
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleOrderDelete = async () => {
    try {
      setOrdersLoading(true)
      const baseUrl = `http://${host}:${port}/api`
      const response = await ordersApi.getByDate(baseUrl, currentDate, 1, ITEM_PER_PAGE)
      setOrders(response.data)
      setOrder(null)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
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
          </div>
        </div>

        {/* Sync status bar — shows real backup health at a glance */}
        {syncStatus && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-[#F6F6F6] px-3 py-2 text-xs">
            <span className="text-secondary">
              Last backup: <b>{formatLastSync(syncStatus.lastSyncAt)}</b>
            </span>
            <span className={syncStatus.pending > 0 ? 'text-yellow-600' : 'text-[#01A920]'}>
              {syncStatus.pending} pending
            </span>
            {syncStatus.isSyncing && <span className="text-primary-700">syncing…</span>}
            {syncStatus.failed > 0 && (
              <>
                <span className="text-[#FD0002] font-medium">{syncStatus.failed} failed</span>
                <button
                  onClick={handleRetryFailed}
                  disabled={isRetrying}
                  className="text-primary-700 underline hover:text-primary-900 disabled:opacity-50"
                >
                  {isRetrying ? 'Retrying…' : 'Retry failed'}
                </button>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-12 gap-2 w-full mt-5">
          <input
            type="search"
            placeholder="Search For Order"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (!e.target.value.trim()) {
                searchForOrder()
              }
            }}
            className="col-span-9 md:col-span-10 w-full px-4 py-2 rounded-md border border-[#DCDCDC] bg-[#F5F5F5DD] placeholder-[#828080] text-[#828080] focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />

          <button
            type="button"
            onClick={searchForOrder}
            className="col-span-3 md:col-span-2 w-full flex items-center justify-center space-x-3 rounded-lg border border-transparent px-4 py-2 text-sm font-bold text-white shadow-sm bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 sm:w-auto"
          >
            <span>Search</span>
          </button>
        </div>

        {/* Order Table */}
        {ordersLoading ? (
          <>
            <OrderTableSkeleton />
          </>
        ) : (
          orders && (
            <OrderTable
              onSelectOrder={setOrder}
              orders={orders}
              fetchMoreOrders={fetchMoreOrders}
            />
          )
        )}
      </div>

      {/* Order Details Section (30%) */}
      <div className="col-span-4 bg-white border-l border-[#DCDCDC]  pl-4">
        {order ? (
          <>
            <OrderDetails order={order} onDeleteOrder={handleOrderDelete} />
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

export default Orders
