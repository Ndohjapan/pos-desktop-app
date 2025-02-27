// @ts-nocheck
import CustomError from '../../utils/customError'
import db from '../client'

export class FoodRepository {
  async findAll() {
    try {
      const foods = db
        .prepare(
          `
        SELECT Food.*, Category.name as category
        FROM Food
        LEFT JOIN Category ON Food.categoryId = Category.id
        WHERE Food.isDeleted = 0
      `
        )
        .all()
      return foods
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async create(data: any) {
    try {
      const statement = db.prepare(`
        INSERT INTO Food (id, name, price, quantity, inStock, image, categoryId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      statement.run(data.id, data.name, data.price, data.quantity, 1, data.image, data.categoryId)

      return { ...data, createdAt: new Date().toISOString() }
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async updateById(id: number, data: Record<string, any>) {
    try {
      const setClause = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(', ')

      const statement = db.prepare(`
        UPDATE Food 
        SET ${setClause}, updatedAt = datetime('now')
        WHERE id = ? AND isDeleted = 0
      `)

      const values = [...Object.values(data), id]
      const result = statement.run(...values)

      return result
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async deleteById(id: number) {
    try {
      const statement = db.prepare(`
        UPDATE Food 
        SET isDeleted = 1, updatedAt = datetime('now')
        WHERE id = ?
      `)

      const result = statement.run(id)
      return result
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async findByFilter(filter: Record<string, any>) {
    try {
      const keys = Object.keys(filter)
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const statement = db.prepare(`
        SELECT Food.name as foodName, Food.*, Category.name as categoryName
        FROM Food
        LEFT JOIN Category ON Food.categoryId = Category.id
        WHERE ${conditions} AND Food.isDeleted = 0
      `)
      const foods = statement.all(...keys.map((k) => filter[k]))
      return foods
    } catch (error) {
      console.log(error)
      throw new CustomError(error.message, 500)
    }
  }


  async insertMany(data: any[]) {
    const insertStatement = db.prepare(`
      INSERT INTO Food (id, name, price, quantity, inStock, image, categoryId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const transaction = db.transaction((foods) => {
      for (const food of foods) {
        insertStatement.run(
          food.id,
          food.name,
          food.price,
          food.quantity,
          food.inStock,
          food.image,
          food.categoryId
        )
      }
    })
    try {
      transaction(data)
      return { success: true, count: data.length }
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }
}
