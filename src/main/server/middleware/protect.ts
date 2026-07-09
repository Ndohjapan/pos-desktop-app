import { Request, Response, NextFunction } from 'express'
import CustomError from '../utils/customError'
import { sendError } from '../utils/errors'
import { AdminRepository } from '../database/repositories/admin.repository'
import { AdminRow } from '../types'

const adminRepository = new AdminRepository()

// Make the authenticated admin available on the request object
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminRow
    }
  }
}

const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if the authorization header is present
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Token Missing', 401)
    }

    // Extract the token from the authorization header
    const token = authHeader.split(' ')[1]

    // Retrieve the admin from the database using the ID from the token
    const admin = await adminRepository.findByFilter({ id: token })

    if (!admin) {
      throw new CustomError('Admin not found', 404)
    }

    // Check if the admin is a super admin
    if (!admin.isSuperAdmin) {
      throw new CustomError('You are not authorized', 403)
    }

    // Attach the admin to the request object
    req.admin = admin

    // Proceed to the next middleware or route handler
    next()
  } catch (error) {
    sendError(res, error)
  }
}

export default protect
