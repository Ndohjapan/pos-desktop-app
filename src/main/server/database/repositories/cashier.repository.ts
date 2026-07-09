import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { CashierRole, CashierRow } from '../../types'

export class CashierRepository {
  create(data: { fullName: string; pin: string; role: CashierRole }): CashierRow {
    try {
      const result = db
        .prepare(
          `INSERT INTO Cashier (fullName, pin, role, active, createdAt, updatedAt)
           VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`
        )
        .run(data.fullName, data.pin, data.role)
      return this.findById(Number(result.lastInsertRowid)) as CashierRow
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findById(id: number): CashierRow | undefined {
    try {
      return db.prepare(`SELECT * FROM Cashier WHERE id = ?`).get(id) as CashierRow | undefined
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findAll(): CashierRow[] {
    try {
      return db.prepare(`SELECT * FROM Cashier ORDER BY fullName ASC`).all() as CashierRow[]
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findActive(): CashierRow[] {
    try {
      return db
        .prepare(`SELECT * FROM Cashier WHERE active = 1 ORDER BY fullName ASC`)
        .all() as CashierRow[]
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  update(
    id: number,
    data: Partial<{ fullName: string; pin: string; role: CashierRole; active: 0 | 1 }>
  ): void {
    try {
      const fields = Object.keys(data)
      if (!fields.length) return
      const setClause = fields.map((f) => `${f} = ?`).join(', ')
      db.prepare(`UPDATE Cashier SET ${setClause}, updatedAt = datetime('now') WHERE id = ?`).run(
        ...Object.values(data),
        id
      )
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}

export const cashierRepository = new CashierRepository()
