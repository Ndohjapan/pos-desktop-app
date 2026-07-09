import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { AdminRow } from '../../types'

export interface CreateAdminData {
  fullName: string
  phoneNumber: string
  password: string
  verified: boolean
  isSuperAdmin: boolean
}

export class AdminRepository {
  async create(data: CreateAdminData): Promise<CreateAdminData & { id: number | bigint }> {
    try {
      const statement = db.prepare(`
        INSERT INTO Admin (fullName, phoneNumber, password, verified, isSuperAdmin, createdAt, updatedAt)
        VALUES (?,?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      const result = statement.run(
        data.fullName,
        data.phoneNumber,
        data.password,
        data.verified ? 1 : 0,
        data.isSuperAdmin ? 1 : 0
      )

      return { ...data, id: result.lastInsertRowid }
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  async findByFilter(filter: Record<string, string | number>): Promise<AdminRow | undefined> {
    try {
      const keys = Object.keys(filter)
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const statement = db.prepare(`
        SELECT * FROM Admin
        WHERE ${conditions}
      `)

      const admin = statement.get(...keys.map((k) => filter[k])) as AdminRow | undefined
      return admin
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}
