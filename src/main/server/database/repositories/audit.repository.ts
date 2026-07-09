import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { AuditLogRow } from '../../types'

export class AuditRepository {
  log(entry: {
    action: string
    orderId?: number | null
    cashierName?: string | null
    approvedBy?: string | null
    reason?: string | null
    detail?: string | null
  }): void {
    try {
      db.prepare(
        `INSERT INTO AuditLog (action, orderId, cashierName, approvedBy, reason, detail, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        entry.action,
        entry.orderId ?? null,
        entry.cashierName ?? null,
        entry.approvedBy ?? null,
        entry.reason ?? null,
        entry.detail ?? null
      )
    } catch (error) {
      // Auditing must never break the primary action, but surface loudly.
      console.error('AUDIT LOG WRITE FAILED:', getErrorMessage(error))
    }
  }

  findRecent(limit = 100): AuditLogRow[] {
    try {
      return db
        .prepare(`SELECT * FROM AuditLog ORDER BY createdAt DESC, id DESC LIMIT ?`)
        .all(limit) as AuditLogRow[]
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}

export const auditRepository = new AuditRepository()
