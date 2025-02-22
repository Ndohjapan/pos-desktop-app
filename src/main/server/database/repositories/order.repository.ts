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
            paymentMethod,
            total,
            backupStatus,
            datetime(createdAt) || 'Z' as createdAt,
            datetime(updatedAt) || 'Z' as updatedAt
          FROM "Order"
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(limit, offset)

      // Attach groups and items to each order
      for (const order of orders) {
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
            paymentMethod,
            total,
            backupStatus,
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
      const insertOrder = db.prepare(`
      INSERT INTO "Order" (paymentMethod, total, backupStatus, createdAt, updatedAt)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `)

      const orderResult = insertOrder.run(
        orderData.paymentMethod,
        orderData.total,
        orderData.backupStatus || 0
      )
      const orderId = orderResult.lastInsertRowid

      const insertGroup = db.prepare(`
      INSERT INTO OrderGroup ( orderId, total)
      VALUES ( ?, ?)
    `)

      const insertItem = db.prepare(`
      INSERT INTO OrderItem ( foodName, quantity, price, amount, foodId, foodCloudId, groupId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

      // Insert groups and items
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

      // Fetch the newly created order with its groups and items
      const newOrder = db
        .prepare(
          `
      SELECT * FROM "Order" WHERE id = ?
    `
        )
        .get(orderId)

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
        SELECT COUNT(*) as count FROM "Order" ${whereClause}
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
}
