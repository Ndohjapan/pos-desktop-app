import db from '../client'
import CustomError from '../../utils/customError'

export class AdminRepository {
  async create(data: any) {
    try {
      const statement = db.prepare(`
        INSERT INTO Admin (fullName, phoneNumber, password, verified, isSuperAdmin, createdAt, updatedAt)
        VALUES (?,?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      const result = statement.run(
        data.fullName,
        data.phoneNumber,
        data.password,
        data.verified || 0,
        data.isSuperAdmin || 0
      )

      return { ...data, id: result.lastInsertRowid }
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }

  async findByFilter(filter: Record<string, any>) {
    try {
      const keys = Object.keys(filter)
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const statement = db.prepare(`
        SELECT * FROM Admin 
        WHERE ${conditions}
      `)

      const admin = statement.get(...keys.map((k) => filter[k]))
      return admin
    } catch (error) {
      throw new CustomError(error.message, 500)
    }
  }
}
