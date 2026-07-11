import db from '../database/client'
import { OrderRepository } from '../database/repositories/order.repository'
import { parkedOrderRepository } from '../database/repositories/parked-order.repository'
import { auditRepository } from '../database/repositories/audit.repository'
import { settingsRepository } from '../database/repositories/settings.repository'
import { cashierService } from './cashier.service'
import CustomError from '../utils/customError'
import { getErrorMessage, toCustomError } from '../utils/errors'
import { rollbar } from '../utils/logging'
import { currentBranch } from '../utils/branch'
import { utilService } from './util.service'
import { CreateOrderInput, DailySummary, DateRangeFilter, OrderFilter } from '../types'

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
      const filter: OrderFilter = {
        createdAt: dayRangeFilter(date),
        branchId: currentBranch().branchId
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
      const filter: OrderFilter = {
        createdAt: dayRangeFilter(date),
        branchId: currentBranch().branchId
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
      // Discounts are a classic leak point: any discount must carry a reason
      // and a valid supervisor PIN, and every one lands in the audit log.
      let approvedBy: string | null = null
      if (orderData.discount && orderData.discount > 0) {
        if (!orderData.discountReason?.trim()) {
          throw new CustomError('A reason is required for discounts', 400)
        }
        const supervisor = await cashierService.verifySupervisor(
          orderData.supervisorPin ?? '',
          `discount ₦${orderData.discount}`
        )
        approvedBy = supervisor.fullName
      }

      // In quick-service mode new orders enter the kitchen queue; the classic
      // restaurant flow keeps the old behaviour (no queue).
      const settings = settingsRepository.getAll()
      const fulfillment = settings.quickService ? 'preparing' : 'served'

      const result = await this.orderRepository.create({ ...orderData, fulfillment })

      if (orderData.discount && orderData.discount > 0) {
        auditRepository.log({
          action: 'discount-applied',
          orderId: result.id,
          cashierName: orderData.cashierName ?? null,
          approvedBy,
          reason: orderData.discountReason ?? null,
          detail: `amount=${orderData.discount}`
        })
      }

      // Resume flow: the parked draft this order came from is now fulfilled.
      if (orderData.parkedOrderId) {
        parkedOrderRepository.delete(orderData.parkedOrderId)
      }

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
      const custom = toCustomError(error)
      // Preserve meaningful client errors (bad PIN, missing reason); only mask
      // genuine internal failures.
      if (custom.code >= 400 && custom.code < 500) throw custom
      rollbar.log(
        getErrorMessage(error),
        {},
        { level: 'error' },
        '(desktop): Failed to create order'
      )
      throw new CustomError('Failed to create order', 500)
    }
  }

  /**
   * Void a completed order: requires a reason and a supervisor PIN. The order
   * stays in history (marked voided), is excluded from sales totals, and is
   * re-queued for cloud upload so the dashboard reflects the void.
   */
  async voidOrder(orderId: number, reason: string, supervisorPin: string, cashierName?: string) {
    try {
      const order = this.orderRepository.findById(orderId)
      if (!order) throw new CustomError('Order not found', 404)
      if (order.status === 'voided') throw new CustomError('Order is already voided', 400)
      if (!reason?.trim()) throw new CustomError('A reason is required to void an order', 400)

      const supervisor = await cashierService.verifySupervisor(
        supervisorPin,
        `void order #${order.orderNumber || orderId}`
      )

      this.orderRepository.void(orderId, reason.trim(), supervisor.fullName)
      auditRepository.log({
        action: 'order-voided',
        orderId,
        cashierName: cashierName ?? null,
        approvedBy: supervisor.fullName,
        reason: reason.trim(),
        detail: `total=${order.total}`
      })

      return this.orderRepository.findById(orderId)
    } catch (error) {
      throw toCustomError(error)
    }
  }

  setFulfillment(orderId: number, fulfillment: string) {
    const allowed = ['preparing', 'ready', 'served']
    if (!allowed.includes(fulfillment)) {
      throw new CustomError(`fulfillment must be one of ${allowed.join(', ')}`, 400)
    }
    const order = this.orderRepository.findById(orderId)
    if (!order) throw new CustomError('Order not found', 404)
    this.orderRepository.setFulfillment(orderId, fulfillment)
    return this.orderRepository.findById(orderId)
  }

  getQueue() {
    return this.orderRepository.findQueue()
  }

  // On-device daily summary: totals, payment split, voids/discounts, top items.
  getDailySummary(date: string): DailySummary {
    const range = dayRangeFilter(date)
    // Every figure is scoped to this machine's current branch.
    const branchId = currentBranch().branchId

    const salesAgg = db
      .prepare(
        `SELECT COUNT(*) as orderCount,
                COALESCE(SUM(total), 0) as grossSales,
                COALESCE(SUM(discount), 0) as totalDiscount,
                COALESCE(SUM(serviceFee), 0) as serviceFees
         FROM "Order"
         WHERE createdAt >= ? AND createdAt <= ? AND status = 'completed' AND isDeleted = 0
           AND branchId = ?`
      )
      .get(range.gte, range.lte, branchId) as {
      orderCount: number
      grossSales: number
      totalDiscount: number
      serviceFees: number
    }

    const voidAgg = db
      .prepare(
        `SELECT COUNT(*) as voidCount, COALESCE(SUM(total), 0) as voidedAmount
         FROM "Order"
         WHERE createdAt >= ? AND createdAt <= ? AND status = 'voided'
           AND branchId = ?`
      )
      .get(range.gte, range.lte, branchId) as { voidCount: number; voidedAmount: number }

    const byPaymentMethod = db
      .prepare(
        `SELECT p.paymentMethod as paymentMethod,
                COALESCE(SUM(p.amount), 0) as amount,
                COUNT(*) as count
         FROM OrderPayment p
         JOIN "Order" o ON o.id = p.orderId
         WHERE o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'completed' AND o.isDeleted = 0
           AND o.branchId = ?
         GROUP BY p.paymentMethod
         ORDER BY amount DESC`
      )
      .all(range.gte, range.lte, branchId) as {
      paymentMethod: string
      amount: number
      count: number
    }[]

    const topItems = db
      .prepare(
        `SELECT i.foodName as foodName,
                COALESCE(SUM(i.quantity), 0) as quantity,
                COALESCE(SUM(i.amount), 0) as amount
         FROM OrderItem i
         JOIN OrderGroup g ON g.id = i.groupId
         JOIN "Order" o ON o.id = g.orderId
         WHERE o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'completed' AND o.isDeleted = 0
           AND o.branchId = ?
         GROUP BY i.foodName
         ORDER BY quantity DESC
         LIMIT 10`
      )
      .all(range.gte, range.lte, branchId) as {
      foodName: string
      quantity: number
      amount: number
    }[]

    return {
      date,
      orderCount: salesAgg.orderCount,
      grossSales: salesAgg.grossSales,
      totalDiscount: salesAgg.totalDiscount,
      serviceFees: salesAgg.serviceFees,
      voidCount: voidAgg.voidCount,
      voidedAmount: voidAgg.voidedAmount,
      byPaymentMethod,
      topItems
    }
  }
}
