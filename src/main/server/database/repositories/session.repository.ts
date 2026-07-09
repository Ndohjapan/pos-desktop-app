import { randomBytes } from 'crypto'
import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { SessionRow } from '../../types'

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours (one working day)

export class SessionRepository {
  // Create a session for an admin and return the opaque bearer token.
  create(adminId: number): string {
    try {
      const token = randomBytes(48).toString('hex')
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
      db.prepare(
        `INSERT INTO Session (token, adminId, expiresAt, createdAt)
         VALUES (?, ?, ?, datetime('now'))`
      ).run(token, adminId, expiresAt)
      return token
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  // Return the session only if it exists and has not expired.
  findValid(token: string): SessionRow | undefined {
    try {
      const session = db.prepare(`SELECT * FROM Session WHERE token = ?`).get(token) as
        | SessionRow
        | undefined
      if (!session) return undefined
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.delete(token)
        return undefined
      }
      return session
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  delete(token: string): void {
    try {
      db.prepare(`DELETE FROM Session WHERE token = ?`).run(token)
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  // Housekeeping: drop expired rows so the table doesn't grow forever.
  purgeExpired(): void {
    try {
      db.prepare(`DELETE FROM Session WHERE expiresAt < ?`).run(new Date().toISOString())
    } catch {
      // best-effort
    }
  }
}
