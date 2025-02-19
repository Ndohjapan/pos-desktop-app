// @ts-nocheck
import CustomError from '../../utils/customError'
import db from '../client'

export class CategoryRepository {
  async findAll() {
    try {
      const categories = db.prepare('SELECT * FROM Category').all()
      return categories
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async findByFilter(filter: Record<string, any>) {
    try {
      const keys = Object.keys(filter)
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const statement = db.prepare(`SELECT * FROM Category WHERE ${conditions}`)
      const categories = statement.all(...keys.map((k) => filter[k]))
      return categories
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async create(data: any) {
    try {
      const existingCategory = db
        .prepare('SELECT * FROM Category WHERE cloudId = ?')
        .get(data.cloudId)

      if (existingCategory) {
        const updateStatement = db.prepare(`
          UPDATE Category SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE cloudId = ?
        `)
        updateStatement.run(data.name, data.cloudId)
        return { ...existingCategory, name: data.name, updatedAt: new Date().toISOString() }
      } else {
        const insertStatement = db.prepare(`
          INSERT INTO Category (id, cloudId, name) VALUES (?, ?, ?)
        `)
        insertStatement.run(data.id, data.cloudId, data.name)
        return { id: data.id, cloudId: data.cloudId, name: data.name }
      }
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }
}
