import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { ShiftRow } from '../../types'

export class ShiftRepository {
  open(cashierId: number, cashierName: string, openingFloat: number): ShiftRow {
    try {
      const result = db
        .prepare(
          `INSERT INTO Shift (cashierId, cashierName, openingFloat, openedAt)
           VALUES (?, ?, ?, datetime('now'))`
        )
        .run(cashierId, cashierName, openingFloat)
      return this.findById(Number(result.lastInsertRowid)) as ShiftRow
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findById(id: number): ShiftRow | undefined {
    try {
      return db.prepare(`SELECT * FROM Shift WHERE id = ?`).get(id) as ShiftRow | undefined
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findOpenByCashier(cashierId: number): ShiftRow | undefined {
    try {
      return db
        .prepare(
          `SELECT * FROM Shift WHERE cashierId = ? AND closedAt IS NULL ORDER BY openedAt DESC LIMIT 1`
        )
        .get(cashierId) as ShiftRow | undefined
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  close(id: number, countedCash: number, expectedCash: number, notes: string | null): ShiftRow {
    try {
      db.prepare(
        `UPDATE Shift SET closedAt = datetime('now'), countedCash = ?, expectedCash = ?, notes = ?
         WHERE id = ?`
      ).run(countedCash, expectedCash, notes, id)
      return this.findById(id) as ShiftRow
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  findRecent(limit = 20): ShiftRow[] {
    try {
      return db
        .prepare(`SELECT * FROM Shift ORDER BY openedAt DESC LIMIT ?`)
        .all(limit) as ShiftRow[]
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}

export const shiftRepository = new ShiftRepository()
