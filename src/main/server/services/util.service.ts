import { OrderRepository } from '../database/repositories/order.repository'
import { FoodService } from './food.service'
import { makeApiRequest } from '../utils/apiRequest'
import { getErrorMessage, toCustomError } from '../utils/errors'
import { rollbar } from '../utils/logging'

export class UtilService {
  private foodService: FoodService
  private orderRepository: OrderRepository
  private backupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.foodService = new FoodService()
    this.orderRepository = new OrderRepository()
    this.startPeriodicBackup()
  }

  async backupFoods(): Promise<boolean> {
    try {
      const foods = await this.foodService.getAllFoods()

      const BATCH_SIZE = 15
      for (let i = 0; i < foods.length; i += BATCH_SIZE) {
        const foodsBatch = foods.slice(i, i + BATCH_SIZE)
        await makeApiRequest({
          url: `${import.meta.env.MAIN_VITE_API_URL}/utils/food-and-categories`,
          method: 'POST',
          body: { foods: foodsBatch }
        })
      }

      return true
    } catch (error) {
      rollbar.log(
        getErrorMessage(error),
        {},
        { level: 'error' },
        '(desktop): Failed to upload foods and categories'
      )
      console.log(`Failed to sync foods and categories: ${getErrorMessage(error)}\n`)
      throw toCustomError(error)
    }
  }

  async uploadOrdersToCloud() {
    const BATCH_SIZE = 500
    let currentPage = 1
    let hasMoreOrders = true
    let uploadedCount = 0
    try {
      await this.backupFoods()

      while (hasMoreOrders) {
        const orderBatch = await this.orderRepository.findByFilterAll(currentPage, BATCH_SIZE, {
          backupStatus: 0
        })

        if (orderBatch.rows.length === 0) {
          hasMoreOrders = false
          break
        }

        await makeApiRequest({
          url: `${import.meta.env.MAIN_VITE_API_URL}/order`,
          method: 'POST',
          body: {
            orders: orderBatch.rows
          }
        })

        // Update backup status for successfully uploaded orders
        for (const order of orderBatch.rows) {
          await this.orderRepository.updateManyByFilter({ id: order.id }, { backupStatus: 1 })
        }

        uploadedCount += orderBatch.rows.length
        currentPage++

        // Optional: Add a small delay between batches to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      return {
        success: true,
        message: `Successfully uploaded ${uploadedCount} orders to cloud`,
        uploadedCount
      }
    } catch (error) {
      rollbar.log(
        getErrorMessage(error),
        { currentPage, hasMoreOrders, uploadedCount },
        { level: 'error' },
        '(desktop): Failed to upload orders to cloud'
      )
      console.log(`Failed to upload orders to cloud: ${getErrorMessage(error)}\n`)
      throw toCustomError(error)
    }
  }

  private startPeriodicBackup(): void {
    // Execute backup every 5 minutes (300000 milliseconds)
    this.backupInterval = setInterval(() => {
      this.uploadOrdersToCloud()
        .then(() => {
          console.log('Scheduled backup: Orders uploaded to cloud successfully')
        })
        .catch((error) => {
          console.error(
            'Scheduled backup: Error uploading orders to cloud:',
            getErrorMessage(error)
          )
        })
    }, 300000)
  }

  public stopPeriodicBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
  }
}
