// @ts-nocheck
import db from '../client'
import CustomError from '../../utils/customError'

export class OrderRepository {
  async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit

      // Fetch orders with pagination
      const orders = db
        .prepare(
          `
          SELECT 
            id,
            total,
            backupStatus,
            datetime(createdAt) || 'Z' as createdAt,
            datetime(updatedAt) || 'Z' as updatedAt
          FROM "Order"
          WHERE isDeleted = 0
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(limit, offset)

      // Attach groups and items to each order
      for (const order of orders) {
        const payments = db
          .prepare(
            `
          SELECT paymentMethod, amount FROM OrderPayment WHERE orderId = ?
        `
          )
          .all(order.id)

        order.payments = payments

        const groups = db
          .prepare(
            `
          SELECT * FROM OrderGroup WHERE orderId = ?
        `
          )
          .all(order.id)

        for (const group of groups) {
          const items = db
            .prepare(
              `
            SELECT * FROM OrderItem WHERE groupId = ?
          `
            )
            .all(group.id)
          group.items = items
        }

        order.groups = groups
      }

      // Get total count
      const total = db.prepare(`SELECT COUNT(*) as count FROM "Order"`).get().count

      return {
        orders,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }

  // This function gets all the orders including deleted ones
  async findByFilterAll(page = 1, limit = 10, filter = {}) {
    try {
      const offset = (page - 1) * limit

      let whereClause = ''
      let values = []
      if (Object.keys(filter).length) {
        const conditions = []

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

        whereClause = 'WHERE ' + conditions.join(' AND ')
      }

      // Fetch filtered orders with pagination
      const orders = db
        .prepare(
          `
          SELECT 
            id,
            total,
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
        .all(...values, limit, offset)

      // Attach groups and items
      for (const order of orders) {
        const payments = db
          .prepare(
            `
          SELECT paymentMethod, amount FROM OrderPayment WHERE orderId = ?
        `
          )
          .all(order.id)

        order.payments = payments

        const groups = db
          .prepare(
            `
          SELECT * FROM OrderGroup WHERE orderId = ?
        `
          )
          .all(order.id)

        for (const group of groups) {
          const items = db
            .prepare(
              `
            SELECT * FROM OrderItem WHERE groupId = ?
          `
            )
            .all(group.id)
          group.items = items
        }

        order.groups = groups
      }

      // Get total count
      const totalRows = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM "Order" ${whereClause}
      `
        )
        .get(...values).count

      const totalPages = Math.ceil(totalRows / limit)

      return {
        rows: orders,
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
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async findByFilter(page = 1, limit = 10, filter = {}) {
    try {
      const offset = (page - 1) * limit

      let whereClause = ''
      let values = []
      if (Object.keys(filter).length) {
        const conditions = []

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

        whereClause = 'WHERE ' + conditions.join(' AND ')
      }

      // Fetch filtered orders with pagination
      const orders = db
        .prepare(
          `
          SELECT 
            id,
            total,
            backupStatus,
            datetime(createdAt) || 'Z' as createdAt,
            datetime(updatedAt) || 'Z' as updatedAt
          FROM "Order"
          ${whereClause} AND isDeleted = 0
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(...values, limit, offset)

      // Attach groups and items
      for (const order of orders) {
        const payments = db
          .prepare(
            `
          SELECT paymentMethod, amount FROM OrderPayment WHERE orderId = ?
        `
          )
          .all(order.id)

        order.payments = payments

        const groups = db
          .prepare(
            `
          SELECT * FROM OrderGroup WHERE orderId = ?
        `
          )
          .all(order.id)

        for (const group of groups) {
          const items = db
            .prepare(
              `
            SELECT * FROM OrderItem WHERE groupId = ?
          `
            )
            .all(group.id)
          group.items = items
        }

        order.groups = groups
      }

      // Get total count
      const totalRows = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM "Order" ${whereClause}
      `
        )
        .get(...values).count

      const totalPages = Math.ceil(totalRows / limit)

      return {
        rows: orders,
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
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async create(orderData) {
    try {
      // Insert order without payment method
      const insertOrder = db.prepare(`
        INSERT INTO "Order" (total, backupStatus, createdAt, updatedAt, isDeleted)
        VALUES (?, ?, datetime('now'), datetime('now'), 0)
      `)

      const orderResult = insertOrder.run(orderData.total, orderData.backupStatus || 0)
      const orderId = orderResult.lastInsertRowid

      // Insert payments
      const insertPayment = db.prepare(`
        INSERT INTO OrderPayment (orderId, paymentMethod, amount)
        VALUES (?, ?, ?)
      `)

      for (const payment of orderData.payments) {
        insertPayment.run(orderId, payment.paymentMethod, payment.amount)
      }

      // Insert groups and items (existing code)
      const insertGroup = db.prepare(`
        INSERT INTO OrderGroup (orderId, total)
        VALUES (?, ?)
      `)

      const insertItem = db.prepare(`
        INSERT INTO OrderItem (foodName, quantity, price, amount, foodId, foodCloudId, groupId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      for (const group of orderData.groups) {
        const groupResult = insertGroup.run(orderId, group.total)
        const groupId = groupResult.lastInsertRowid
        for (const item of group.items) {
          insertItem.run(
            item.foodName,
            item.quantity,
            item.price,
            item.amount,
            item.id,
            item.cloudId,
            groupId
          )
        }
      }

      // Fetch the complete order with payments, groups and items
      const newOrder = db
        .prepare(
          `
        SELECT * FROM "Order" WHERE id = ?
      `
        )
        .get(orderId)

      // Fetch payments for this order
      const payments = db
        .prepare(
          `
        SELECT paymentMethod, amount FROM OrderPayment WHERE orderId = ?
      `
        )
        .all(orderId)

      newOrder.payments = payments

      const groups = db
        .prepare(
          `
        SELECT * FROM OrderGroup WHERE orderId = ?
      `
        )
        .all(orderId)

      for (const group of groups) {
        const items = db
          .prepare(
            `
          SELECT * FROM OrderItem WHERE groupId = ?
        `
          )
          .all(group.id)
        group.items = items
      }

      newOrder.groups = groups

      return newOrder
    } catch (error) {
      console.log(error)
      throw new CustomError(error.message, error.code || 500)
    }
  }
  async count(filter = {}) {
    try {
      let whereClause = ''
      let values = []
      if (Object.keys(filter).length) {
        whereClause =
          'WHERE ' +
          Object.keys(filter)
            .map((key) => `${key} = ?`)
            .join(' AND ')
        values = Object.values(filter)
      }

      const count = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM "Order" ${whereClause} AND isDeleted = 0
      `
        )
        .get(...values).count

      return count
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async updateManyByFilter(filter, data) {
    try {
      let whereClause = ''
      let values = []
      if (Object.keys(filter).length) {
        whereClause =
          'WHERE ' +
          Object.keys(filter)
            .map((key) => `${key} = ?`)
            .join(' AND ')
        values = Object.values(filter)
      }

      let setClause = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(', ')
      let setValues = Object.values(data)

      const updateQuery = `
        UPDATE "Order" 
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        ${whereClause}
      `

      const updateResult = db.prepare(updateQuery).run(...setValues, ...values)

      return updateResult
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
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
      throw new CustomError(error.message, 500)
    }
  }
}
