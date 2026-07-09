import { Request, Response, NextFunction } from 'express'
import CustomError from '../utils/customError'
import { sendError } from '../utils/errors'
import { AdminRepository } from '../database/repositories/admin.repository'
import { SessionRepository } from '../database/repositories/session.repository'
import { AdminRow } from '../types'

const adminRepository = new AdminRepository()
const sessionRepository = new SessionRepository()

// Make the authenticated admin available on the request object
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminRow
    }
  }
}

/**
 * Validates a real session token (not the old forgeable admin row-id). Resolves
 * the token to a live, non-expired session, loads the admin, and requires super
 * admin for the protected write routes.
 */
const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Token Missing', 401)
    }

    const token = authHeader.split(' ')[1]
    const session = sessionRepository.findValid(token)
    if (!session) {
      throw new CustomError('Session expired or invalid — please log in again', 401)
    }

    const admin = await adminRepository.findById(session.adminId)
    if (!admin) {
      throw new CustomError('Admin not found', 404)
    }

    if (!admin.isSuperAdmin) {
      throw new CustomError('You are not authorized', 403)
    }

    req.admin = admin
    next()
  } catch (error) {
    sendError(res, error)
  }
}

export default protect
