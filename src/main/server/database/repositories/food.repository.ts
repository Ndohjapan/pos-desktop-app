import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import db from '../client'
import { FoodRow, FoodWithCategoryRow } from '../../types'
import { currentBranch } from '../../utils/branch'

export interface CreateFoodData {
  id?: number
  name: string
  price: number
  quantity: number
  image: string | null
  categoryId: number
}

export class FoodRepository {
  // The machine's menu — only this branch's foods.
  async findAll(): Promise<FoodWithCategoryRow[]> {
    try {
      const foods = db
        .prepare(
          `
        SELECT Food.*, Category.name as category
        FROM Food
        LEFT JOIN Category ON Food.categoryId = Category.id
        WHERE Food.isDeleted = 0 AND Food.branchId = ?
      `
        )
        .all(currentBranch().branchId) as FoodWithCategoryRow[]
      return foods
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  // Every food across ALL branches on this machine (with its branchId), used by
  // the cloud backup so each branch's menu is uploaded under its own branch.
  async findAllForBackup(): Promise<FoodWithCategoryRow[]> {
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
        .all() as FoodWithCategoryRow[]
      return foods
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async create(data: CreateFoodData): Promise<CreateFoodData & { createdAt: string }> {
    try {
      const statement = db.prepare(`
        INSERT INTO Food (id, name, price, quantity, inStock, image, categoryId, branchId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      statement.run(
        data.id ?? null,
        data.name,
        data.price,
        data.quantity,
        1,
        data.image,
        data.categoryId,
        currentBranch().branchId
      )

      return { ...data, createdAt: new Date().toISOString() }
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async updateById(id: number, data: Record<string, string | number | null>) {
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
      throw new CustomError(getErrorMessage(error), 500)
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
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async findByFilter(filter: Record<string, string | number>): Promise<FoodWithCategoryRow[]> {
    try {
      const keys = Object.keys(filter)
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const statement = db.prepare(`
        SELECT Food.name as foodName, Food.*, Category.name as categoryName
        FROM Food
        LEFT JOIN Category ON Food.categoryId = Category.id
        WHERE ${conditions} AND Food.isDeleted = 0
      `)
      const foods = statement.all(...keys.map((k) => filter[k])) as FoodWithCategoryRow[]
      return foods
    } catch (error) {
      console.log(error)
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async insertMany(data: FoodRow[]) {
    const branchId = currentBranch().branchId
    const insertStatement = db.prepare(`
      INSERT INTO Food (id, name, price, quantity, inStock, image, categoryId, branchId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const transaction = db.transaction((foods: FoodRow[]) => {
      for (const food of foods) {
        insertStatement.run(
          food.id,
          food.name,
          food.price,
          food.quantity,
          food.inStock,
          food.image,
          food.categoryId,
          food.branchId || branchId
        )
      }
    })
    try {
      transaction(data)
      return { success: true, count: data.length }
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}
