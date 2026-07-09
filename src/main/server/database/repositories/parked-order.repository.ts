import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { ParkedOrderRow } from '../../types'

export class ParkedOrderRepository {
  create(data: {
    label: string
    cashierId: number | null
    cashierName: string | null
    payload: string
  }): ParkedOrderRow {
    try {
      const result = db
        .prepare(
          `INSERT INTO ParkedOrder (label, cashierId, cashierName, payload, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .run(data.label, data.cashierId, data.cashierName, data.payload)
      return this.findById(Number(result.lastInsertRowid)) as ParkedOrderRow
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findById(id: number): ParkedOrderRow | undefined {
    try {
      return db.prepare(`SELECT * FROM ParkedOrder WHERE id = ?`).get(id) as
        | ParkedOrderRow
        | undefined
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findAll(): ParkedOrderRow[] {
    try {
      return db
        .prepare(`SELECT * FROM ParkedOrder ORDER BY createdAt ASC`)
        .all() as ParkedOrderRow[]
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  delete(id: number): void {
    try {
      db.prepare(`DELETE FROM ParkedOrder WHERE id = ?`).run(id)
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}

export const parkedOrderRepository = new ParkedOrderRepository()
