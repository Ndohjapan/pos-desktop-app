//@ts-nocheck
import { OrderRepository } from '../database/repositories/order.repository'
import { CategoryService } from './category.service'
import { FoodService } from './food.service'
import { makeApiRequest } from '../utils/apiRequest'
import CustomError from '../utils/customError'

export class UtilService {
  private categoryService: CategoryService
  private foodService: FoodService
  private orderRepository: OrderRepository
  private backupInterval: NodeJS.Timer

  constructor() {
    this.categoryService = new CategoryService()
    this.foodService = new FoodService()
    this.orderRepository = new OrderRepository()
    this.startPeriodicBackup()
  }

  async getAllFoodsAndCategories(): Promise<any> {
    try {
      const backedUpOrderCount = await this.orderRepository.count({ backupStatus: 0 })

      if (backedUpOrderCount > 0) {
        throw new CustomError('Please backup your orders before syncing', 400)
      }

      const result = await makeApiRequest({
        url: `${import.meta.env.MAIN_VITE_API_URL}/utils/food-and-categories`,
        method: 'GET'
      })

      for (const category of result.data.categories) {
        await this.categoryService.createCategory({
          _id: category._id,
          name: category.name
        })
      }

      for (const food of result.data.foods) {
        await this.foodService.upsertFood(food)
      }

      return result
    } catch (error) {
      console.log(error)
      console.log(`Failed to sync foods and categories: ${error.message}\n`)
      throw new CustomError(error.message, error.code || 500)
    }
  }
  async uploadOrdersToCloud() {
    try {
      const BATCH_SIZE = 500
      let currentPage = 1
      let hasMoreOrders = true
      let uploadedCount = 0

      while (hasMoreOrders) {
        const orderBatch = await this.orderRepository.findByFilter(currentPage, BATCH_SIZE, {
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
      console.log(error)
      console.log(`Failed to upload orders to cloud: ${error.message}\n`)
      throw new CustomError(error.message, error.code || 500)
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
          console.error('Scheduled backup: Error uploading orders to cloud:', error.message)
        })
    }, 300000)
  }

  public stopPeriodicBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }
  }
}
