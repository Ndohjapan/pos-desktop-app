import { OrderRepository } from '../database/repositories/order.repository'
import CustomError from '../utils/customError'
import { getErrorMessage } from '../utils/errors'
import { rollbar } from '../utils/logging'
import { utilService } from './util.service'
import { CreateOrderInput, DateRangeFilter, OrderFilter } from '../types'

// Orders are stored by SQLite as UTC 'YYYY-MM-DD HH:MM:SS'. The old code compared
// that against ISO strings ('...T...Z'), which is lexicographically wrong at the
// 'T'/space boundary — so orders near midnight (and the WAT +1h offset) landed on
// the wrong day. This builds the *local* day's boundaries and formats them in the
// exact stored format so the comparison is correct.
function toDbUtc(date: Date): string {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '')
}

function dayRangeFilter(dateStr: string): DateRangeFilter {
  const [year, month, day] = dateStr.split('-').map(Number)
  const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0)
  const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999)
  return { gte: toDbUtc(startLocal), lte: toDbUtc(endLocal) }
}

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
      const filter: OrderFilter = { createdAt: dayRangeFilter(date) }
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
      const filter: OrderFilter = { createdAt: dayRangeFilter(date) }

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
