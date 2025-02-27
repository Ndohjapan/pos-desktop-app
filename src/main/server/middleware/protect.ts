import { Request, Response, NextFunction } from 'express'
import CustomError from '../utils/customError' // Adjust the import based on your project structure
import { AdminRepository } from '../database/repositories/admin.repository'

const adminRepository = new AdminRepository()

const protect = async (req: Request, res: Response, next: NextFunction) => {
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
    res.status(error.code).json({ message: error.message })
  }
}

export default protect
