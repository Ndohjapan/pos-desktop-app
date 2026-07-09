import { OrderRepository } from '../database/repositories/order.repository'
import { FoodService } from './food.service'
import { makeApiRequest, retryTransient, NETWORK_ERROR_CODE } from '../utils/apiRequest'
import { getErrorMessage, toCustomError } from '../utils/errors'
import { rollbar } from '../utils/logging'
import CustomError from '../utils/customError'
import type { OrderWithDetails } from '../types'

// backupStatus values on the Order table:
//   0 = pending (not yet uploaded)   1 = uploaded OK   2 = errored (rejected)
const BACKUP_PENDING = 0
const BACKUP_DONE = 1
const BACKUP_ERROR = 2

const SYNC_INTERVAL_MS = 300000 // 5 minutes

export interface SyncStatus {
  isSyncing: boolean
  lastSyncAt: string | null
  lastError: string | null
  pending: number
  failed: number
  lastUploadedCount: number
}

function ingestHeaders(): Record<string, string> {
  // Sent on every cloud write; the cloud only enforces it if it has a key
  // configured, so this is safe to roll out incrementally.
  const key = import.meta.env.MAIN_VITE_INGEST_KEY
  return key ? { 'x-api-key': key } : {}
}

export class UtilService {
  private foodService: FoodService
  private orderRepository: OrderRepository
  private backupInterval: NodeJS.Timeout | null = null

  // Mutex: guarantees only one sync run touches backupStatus at a time, so the
  // periodic timer and the after-each-order trigger can never overlap and
  // double-upload the same rows.
  private isSyncing = false
  private lastSyncAt: string | null = null
  private lastError: string | null = null
  private lastUploadedCount = 0

  constructor() {
    this.foodService = new FoodService()
    this.orderRepository = new OrderRepository()
  }

  async getStatus(): Promise<SyncStatus> {
    const pending = await this.orderRepository.count({ backupStatus: BACKUP_PENDING })
    const failed = await this.orderRepository.count({ backupStatus: BACKUP_ERROR })
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      pending,
      failed,
      lastUploadedCount: this.lastUploadedCount
    }
  }

  async backupFoods(): Promise<boolean> {
    const foods = await this.foodService.getAllFoods()
    const BATCH_SIZE = 15

    for (let i = 0; i < foods.length; i += BATCH_SIZE) {
      const foodsBatch = foods.slice(i, i + BATCH_SIZE)
      await retryTransient(
        () =>
          makeApiRequest({
            url: `${import.meta.env.MAIN_VITE_API_URL}/utils/food-and-categories`,
            method: 'POST',
            headers: ingestHeaders(),
            body: { foods: foodsBatch }
          }),
        { label: 'backup-foods' }
      )
    }
    return true
  }

  /**
   * Upload one page of pending orders. Tries the whole batch first (fast path);
   * if the *server rejects* the batch (validation), falls back to per-order
   * uploads so one poison order can't block everyone else — good orders go up,
   * bad ones are flagged (backupStatus=2) and left for reconciliation. A pure
   * network failure is rethrown so the caller aborts and retries next cycle.
   */
  private async uploadBatch(
    orders: OrderWithDetails[]
  ): Promise<{ uploaded: number; failed: number }> {
    try {
      await retryTransient(
        () =>
          makeApiRequest({
            url: `${import.meta.env.MAIN_VITE_API_URL}/order`,
            method: 'POST',
            headers: ingestHeaders(),
            body: { orders }
          }),
        { label: 'backup-orders-batch' }
      )
      for (const order of orders) {
        await this.orderRepository.updateManyByFilter(
          { id: order.id },
          { backupStatus: BACKUP_DONE }
        )
      }
      return { uploaded: orders.length, failed: 0 }
    } catch (error) {
      // Network failure after retries — bubble up so the run stops cleanly and
      // these orders stay pending for the next cycle (nothing marked errored).
      if (error instanceof CustomError && error.code === NETWORK_ERROR_CODE) {
        throw error
      }

      // Server rejected the batch — isolate each order individually.
      let uploaded = 0
      let failed = 0
      for (const order of orders) {
        try {
          await retryTransient(
            () =>
              makeApiRequest({
                url: `${import.meta.env.MAIN_VITE_API_URL}/order`,
                method: 'POST',
                headers: ingestHeaders(),
                body: { orders: [order] }
              }),
            { label: `backup-order-${order.id}` }
          )
          await this.orderRepository.updateManyByFilter(
            { id: order.id },
            { backupStatus: BACKUP_DONE }
          )
          uploaded++
        } catch (orderError) {
          if (orderError instanceof CustomError && orderError.code === NETWORK_ERROR_CODE) {
            throw orderError // network dropped mid-isolation — stop the run
          }
          await this.orderRepository.updateManyByFilter(
            { id: order.id },
            { backupStatus: BACKUP_ERROR }
          )
          failed++
          rollbar.log(
            getErrorMessage(orderError),
            { orderId: order.id },
            { level: 'error' },
            '(desktop): order rejected by cloud, flagged for reconciliation'
          )
        }
      }
      return { uploaded, failed }
    }
  }

  async uploadOrdersToCloud(): Promise<{
    success: boolean
    message: string
    uploadedCount: number
  }> {
    // Mutex — skip if a run is already in progress.
    if (this.isSyncing) {
      return { success: true, message: 'Sync already in progress', uploadedCount: 0 }
    }
    this.isSyncing = true

    const BATCH_SIZE = 500
    let uploadedCount = 0
    let failedCount = 0

    try {
      // Foods must exist on the cloud before orders reference them.
      // backupFoods already retries transient failures per batch internally.
      await this.backupFoods()

      let hasMoreOrders = true
      while (hasMoreOrders) {
        const orderBatch = await this.orderRepository.findByFilterAll(1, BATCH_SIZE, {
          backupStatus: BACKUP_PENDING
        })

        if (orderBatch.rows.length === 0) {
          hasMoreOrders = false
          break
        }

        const result = await this.uploadBatch(orderBatch.rows)
        uploadedCount += result.uploaded
        failedCount += result.failed

        // If every row in this page ended up errored (not uploaded), stop —
        // otherwise we'd loop forever on the same poison page.
        if (result.uploaded === 0 && result.failed === orderBatch.rows.length) {
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      this.lastSyncAt = new Date().toISOString()
      this.lastError =
        failedCount > 0 ? `${failedCount} order(s) rejected by cloud — see analytics` : null
      this.lastUploadedCount = uploadedCount

      return {
        success: true,
        message: `Uploaded ${uploadedCount} order(s)${failedCount ? `, ${failedCount} failed` : ''}`,
        uploadedCount
      }
    } catch (error) {
      this.lastError = getErrorMessage(error)
      rollbar.log(
        getErrorMessage(error),
        { uploadedCount, failedCount },
        { level: 'error' },
        '(desktop): Failed to upload orders to cloud'
      )
      console.log(`Failed to upload orders to cloud: ${getErrorMessage(error)}\n`)
      throw toCustomError(error)
    } finally {
      this.isSyncing = false
    }
  }

  // Re-queue previously-errored orders for another attempt (manual action).
  async retryFailedOrders(): Promise<{ requeued: number }> {
    const failed = await this.orderRepository.count({ backupStatus: BACKUP_ERROR })
    await this.orderRepository.updateManyByFilter(
      { backupStatus: BACKUP_ERROR },
      { backupStatus: BACKUP_PENDING }
    )
    return { requeued: failed }
  }

  // Idempotent: start the single periodic scheduler (clears any prior timer).
  start(): void {
    this.stop()
    this.backupInterval = setInterval(() => {
      this.uploadOrdersToCloud()
        .then(() => console.log('Scheduled backup complete'))
        .catch((error) => console.error('Scheduled backup error:', getErrorMessage(error)))
    }, SYNC_INTERVAL_MS)
  }

  stop(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
  }
}

// Single shared instance — every caller (order creation, routes, scheduler)
// uses this one, so there is exactly one timer and one mutex.
export const utilService = new UtilService()
