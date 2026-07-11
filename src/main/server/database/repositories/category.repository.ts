import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import db from '../client'
import { CategoryRow } from '../../types'

export class CategoryRepository {
  async findAll(): Promise<CategoryRow[]> {
    try {
      const categories = db.prepare('SELECT * FROM Category').all() as CategoryRow[]
      return categories
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async findByFilter(filter: Record<string, string | number>): Promise<CategoryRow[]> {
    try {
      const keys = Object.keys(filter)
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const statement = db.prepare(`SELECT * FROM Category WHERE ${conditions}`)
      const categories = statement.all(...keys.map((k) => filter[k])) as CategoryRow[]
      return categories
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async create(data: { name: string }): Promise<{ name: string; id: number | bigint }> {
    try {
      const insertStatement = db.prepare(`
        INSERT INTO Category (name) VALUES (?)
      `)
      const result = insertStatement.run(data.name)
      return { ...data, id: result.lastInsertRowid }
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}
