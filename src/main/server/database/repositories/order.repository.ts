import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage, toCustomError } from '../../utils/errors'
import {
  CreateOrderInput,
  OrderFilter,
  OrderGroupWithItems,
  OrderItemRow,
  OrderPaymentRow,
  OrderRow,
  OrderWithDetails,
  PaginatedOrders
} from '../../types'

interface CountRow {
  count: number
}

// Build "createdAt >= ? AND createdAt <= ?" style conditions from a filter object
function buildWhereClause(filter: OrderFilter): {
  whereClause: string
  values: (string | number)[]
} {
  if (!Object.keys(filter).length) {
    return { whereClause: '', values: [] }
  }

  const conditions: string[] = []
  const values: (string | number)[] = []

  Object.entries(filter).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      if ('gte' in value) {
        conditions.push(`${key} >= ?`)
        values.push(value.gte)
      }
      if ('lte' in value) {
        conditions.push(`${key} <= ?`)
        values.push(value.lte)
      }
    } else {
      conditions.push(`${key} = ?`)
      values.push(value)
    }
  })

  return { whereClause: 'WHERE ' + conditions.join(' AND '), values }
}

export class OrderRepository {
  // Attach payments, groups and items to a bare order row
  private hydrateOrder(order: OrderRow): OrderWithDetails {
    const payments = db
      .prepare(`SELECT paymentMethod, amount FROM OrderPayment WHERE orderId = ?`)
      .all(order.id) as OrderPaymentRow[]

    const groups = db
      .prepare(`SELECT * FROM OrderGroup WHERE orderId = ?`)
      .all(order.id) as OrderGroupWithItems[]

    for (const group of groups) {
      group.items = db
        .prepare(`SELECT * FROM OrderItem WHERE groupId = ?`)
        .all(group.id) as OrderItemRow[]
    }

    return { ...order, payments, groups }
  }

  async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit

      const orders = db
        .prepare(
          `
          SELECT
            id,
            total,
            subTotal,
            serviceFee,
            specialOrder,
            backupStatus,
            datetime(createdAt) || 'Z' as createdAt,
            datetime(updatedAt) || 'Z' as updatedAt
          FROM "Order"
          WHERE isDeleted = 0
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(limit, offset) as OrderRow[]

      const hydrated = orders.map((order) => this.hydrateOrder(order))

      const total = (db.prepare(`SELECT COUNT(*) as count FROM "Order"`).get() as CountRow).count

      return {
        orders: hydrated,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw toCustomError(error)
    }
  }

  // This function gets all the orders including deleted ones
  async findByFilterAll(page = 1, limit = 10, filter: OrderFilter = {}): Promise<PaginatedOrders> {
    try {
      const offset = (page - 1) * limit
      const { whereClause, values } = buildWhereClause(filter)

      const orders = db
        .prepare(
          `
          SELECT
            id,
            total,
            subTotal,
            serviceFee,
            specialOrder,
            backupStatus,
            isDeleted,
            datetime(createdAt) || 'Z' as createdAt,
            datetime(updatedAt) || 'Z' as updatedAt
          FROM "Order"
          ${whereClause}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(...values, limit, offset) as OrderRow[]

      const hydrated = orders.map((order) => this.hydrateOrder(order))

      const totalRows = (
        db
          .prepare(`SELECT COUNT(*) as count FROM "Order" ${whereClause}`)
          .get(...values) as CountRow
      ).count

      const totalPages = Math.ceil(totalRows / limit)

      return {
        rows: hydrated,
        totalRows,
        limit,
        totalPages,
        page,
        pagingCounter: offset + 1,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      }
    } catch (error) {
      throw toCustomError(error)
    }
  }

  async findByFilter(page = 1, limit = 10, filter: OrderFilter = {}): Promise<PaginatedOrders> {
    try {
      const offset = (page - 1) * limit
      const { whereClause, values } = buildWhereClause(filter)

      // Exclude soft-deleted orders whether or not a filter was supplied
      const notDeletedClause = whereClause
        ? `${whereClause} AND isDeleted = 0`
        : 'WHERE isDeleted = 0'

      const orders = db
        .prepare(
          `
          SELECT
            id,
            total,
            subTotal,
            serviceFee,
            specialOrder,
            backupStatus,
            datetime(createdAt) || 'Z' as createdAt,
            datetime(updatedAt) || 'Z' as updatedAt
          FROM "Order"
          ${notDeletedClause}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(...values, limit, offset) as OrderRow[]

      const hydrated = orders.map((order) => this.hydrateOrder(order))

      const totalRows = (
        db
          .prepare(`SELECT COUNT(*) as count FROM "Order" ${notDeletedClause}`)
          .get(...values) as CountRow
      ).count

      const totalPages = Math.ceil(totalRows / limit)

      return {
        rows: hydrated,
        totalRows,
        limit,
        totalPages,
        page,
        pagingCounter: offset + 1,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      }
    } catch (error) {
      throw toCustomError(error)
    }
  }

  async create(
    orderData: CreateOrderInput & { backupStatus?: 0 | 1; fulfillment?: string }
  ): Promise<OrderWithDetails> {
    try {
      // Whole creation is one transaction: the daily ticket number is computed
      // and the rows inserted atomically, so two tills can never mint the same
      // number or leave a half-written order behind.
      const orderId = db.transaction(() => {
        const { nextNumber } = db
          .prepare(
            `SELECT COALESCE(MAX(orderNumber), 0) + 1 as nextNumber
             FROM "Order"
             WHERE date(createdAt, 'localtime') = date('now', 'localtime')`
          )
          .get() as { nextNumber: number }

        const orderResult = db
          .prepare(
            `INSERT INTO "Order"
               (total, subTotal, specialOrder, serviceFee, backupStatus,
                orderNumber, status, fulfillment, cashierId, cashierName, shiftId,
                discount, discountReason, tendered, changeDue,
                createdAt, updatedAt, isDeleted)
             VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0)`
          )
          .run(
            orderData.total,
            orderData.subTotal,
            orderData.specialOrder,
            orderData.serviceFee,
            orderData.backupStatus || 0,
            nextNumber,
            orderData.fulfillment ?? 'served',
            orderData.cashierId ?? null,
            orderData.cashierName ?? null,
            orderData.shiftId ?? null,
            orderData.discount ?? 0,
            orderData.discountReason ?? null,
            orderData.tendered ?? 0,
            orderData.changeDue ?? 0
          )
        const newOrderId = orderResult.lastInsertRowid as number

        const insertPayment = db.prepare(`
          INSERT INTO OrderPayment (orderId, paymentMethod, amount)
          VALUES (?, ?, ?)
        `)

        for (const payment of orderData.payments) {
          insertPayment.run(newOrderId, payment.paymentMethod, payment.amount)
        }

        const insertGroup = db.prepare(`
          INSERT INTO OrderGroup (orderId, total)
          VALUES (?, ?)
        `)

        const insertItem = db.prepare(`
          INSERT INTO OrderItem (foodName, quantity, price, amount, foodId, groupId)
          VALUES (?, ?, ?, ?, ?, ?)
        `)

        for (const group of orderData.groups) {
          const groupResult = insertGroup.run(newOrderId, group.total)
          const groupId = groupResult.lastInsertRowid
          for (const item of group.items) {
            insertItem.run(
              item.foodName,
              item.quantity,
              item.price,
              item.amount,
              item.id,
              groupId
            )
          }
        }

        return newOrderId
      })()

      const newOrder = db.prepare(`SELECT * FROM "Order" WHERE id = ?`).get(orderId) as OrderRow

      return this.hydrateOrder(newOrder)
    } catch (error) {
      console.log(error)
      throw toCustomError(error)
    }
  }

  findById(id: number): OrderWithDetails | undefined {
    const order = db.prepare(`SELECT * FROM "Order" WHERE id = ?`).get(id) as OrderRow | undefined
    return order ? this.hydrateOrder(order) : undefined
  }

  // Mark an order voided (kept in history + uploaded to the cloud as voided).
  void(id: number, reason: string, voidedBy: string): void {
    db.prepare(
      `UPDATE "Order"
       SET status = 'voided', voidReason = ?, voidedBy = ?, backupStatus = 0, updatedAt = datetime('now')
       WHERE id = ?`
    ).run(reason, voidedBy, id)
  }

  setFulfillment(id: number, fulfillment: string): void {
    db.prepare(`UPDATE "Order" SET fulfillment = ?, updatedAt = datetime('now') WHERE id = ?`).run(
      fulfillment,
      id
    )
  }

  // Today's active queue: paid orders not yet served, oldest first.
  findQueue(): OrderWithDetails[] {
    const rows = db
      .prepare(
        `SELECT * FROM "Order"
         WHERE date(createdAt, 'localtime') = date('now', 'localtime')
           AND status = 'completed' AND isDeleted = 0
           AND fulfillment IN ('preparing', 'ready')
         ORDER BY createdAt ASC`
      )
      .all() as OrderRow[]
    return rows.map((row) => this.hydrateOrder(row))
  }

  async count(filter: Record<string, string | number> = {}): Promise<number> {
    try {
      let whereClause = ''
      let values: (string | number)[] = []
      if (Object.keys(filter).length) {
        whereClause =
          'WHERE ' +
          Object.keys(filter)
            .map((key) => `${key} = ?`)
            .join(' AND ')
        values = Object.values(filter)
      }

      // Exclude soft-deleted orders whether or not a filter was supplied
      const notDeletedClause = whereClause
        ? `${whereClause} AND isDeleted = 0`
        : 'WHERE isDeleted = 0'

      const count = (
        db
          .prepare(`SELECT COUNT(*) as count FROM "Order" ${notDeletedClause}`)
          .get(...values) as CountRow
      ).count

      return count
    } catch (error) {
      throw toCustomError(error)
    }
  }

  async updateManyByFilter(
    filter: Record<string, string | number>,
    data: Record<string, string | number>
  ) {
    try {
      let whereClause = ''
      let values: (string | number)[] = []
      if (Object.keys(filter).length) {
        whereClause =
          'WHERE ' +
          Object.keys(filter)
            .map((key) => `${key} = ?`)
            .join(' AND ')
        values = Object.values(filter)
      }

      const setClause = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(', ')
      const setValues = Object.values(data)

      const updateQuery = `
        UPDATE "Order"
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        ${whereClause}
      `

      const updateResult = db.prepare(updateQuery).run(...setValues, ...values)

      return updateResult
    } catch (error) {
      throw toCustomError(error)
    }
  }

  async deleteById(id: number | string) {
    try {
      const statement = db.prepare(`
        UPDATE "Order"
        SET isDeleted = 1, updatedAt = datetime('now'), backupStatus = 0
        WHERE id = ?
      `)

      const result = statement.run(id)
      return result
    } catch (error) {
      console.log(error)
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}
