import { OrderRepository } from '../database/repositories/order.repository'
import CustomError from '../utils/customError'
import { UtilService } from './util.service'
import fs from 'fs'

export class OrderService {
  private orderRepository: OrderRepository
  private utilService: UtilService

  constructor() {
    this.orderRepository = new OrderRepository()
    this.utilService = new UtilService()
  }

  async getAllOrders(page?: number, limit?: number) {
    return this.orderRepository.findAll(page, limit)
  }

  async getOrdersByDate(page: number, limit: number, date: string) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const filter = {
        createdAt: {
          gte: startOfDay.toISOString(),
          lte: endOfDay.toISOString()
        }
      }

      const orders = await this.orderRepository.findByFilter(page, limit, filter)

      fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2))

      return orders
    } catch (error) {
      console.log(error)
      throw new CustomError('Failed to get order', 500)
    }
  }

  async createOrder(orderData: any) {
    try {
      // Generate orderId (you can implement your own logic)
      const orderId = `${String(Date.now()).slice(-6)}`

      const data = {
        ...orderData,
        orderId
      }

      const result = await this.orderRepository.create(data)

      this.utilService
        .uploadOrdersToCloud()
        .then(() => {
          console.log('Uploaded orders to cloud')
        })
        .catch((error) => {
          console.error('Error uploading orders to cloud:', error.message)
        })

      return result
    } catch (error) {
      throw new CustomError('Failed to create order', 500)
    }
  }
}
