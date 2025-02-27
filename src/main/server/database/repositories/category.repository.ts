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
      const insertStatement = db.prepare(`
        INSERT INTO Category (name) VALUES (?)
      `)
      const result = insertStatement.run(data.name)
      return { ...data, id: result.lastInsertRowid }
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }
}
