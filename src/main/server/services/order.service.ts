import { OrderRepository } from '../database/repositories/order.repository'
import CustomError from '../utils/customError'
import { getErrorMessage } from '../utils/errors'
import { rollbar } from '../utils/logging'
import { utilService } from './util.service'
import { CreateOrderInput, OrderFilter } from '../types'

export class OrderService {
  private orderRepository: OrderRepository

  constructor() {
    this.orderRepository = new OrderRepository()
  }

  async getAllOrders(page?: number, limit?: number) {
    return this.orderRepository.findAll(page, limit)
  }

  async deleteOrder(orderId: string | number) {
    try {
      await this.orderRepository.deleteById(orderId)
      return
    } catch (error) {
      console.log(error)
      rollbar.log(
        getErrorMessage(error),
        {},
        { level: 'error' },
        '(desktop): Failed to delete order'
      )
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async getOrdersByDate(page: number, limit: number, date: string) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const filter: OrderFilter = {
        createdAt: {
          gte: startOfDay.toISOString(),
          lte: endOfDay.toISOString()
        }
      }

      const orders = await this.orderRepository.findByFilter(page, limit, filter)

      return orders
    } catch (error) {
      console.log(error)
      rollbar.log(getErrorMessage(error), {}, { level: 'error' }, '(desktop): Failed to get order')
      throw new CustomError('Failed to get order', 500)
    }
  }

  async searchOrders(page: number, limit: number, date: string, searchQuery: string) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const filter: OrderFilter = {
        createdAt: {
          gte: startOfDay.toISOString(),
          lte: endOfDay.toISOString()
        }
      }

      // Add LIKE query for ID search
      if (searchQuery) {
        filter.id = searchQuery
      }

      const orders = await this.orderRepository.findByFilter(page, limit, filter)
      return orders
    } catch (error) {
      rollbar.log(
        getErrorMessage(error),
        {},
        { level: 'error' },
        '(desktop): Failed to search orders'
      )
      throw new CustomError('Failed to search orders', 500)
    }
  }

  async createOrder(orderData: CreateOrderInput) {
    try {
      const result = await this.orderRepository.create(orderData)

      utilService
        .uploadOrdersToCloud()
        .then(() => {
          console.log('Uploaded orders to cloud')
        })
        .catch((error) => {
          console.error('Error uploading orders to cloud:', getErrorMessage(error))
        })

      return result
    } catch (error) {
      rollbar.log(
        getErrorMessage(error),
        {},
        { level: 'error' },
        '(desktop): Failed to create order'
      )
      throw new CustomError('Failed to create order', 500)
    }
  }
}
