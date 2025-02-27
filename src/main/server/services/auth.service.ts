import { AdminRepository } from '../database/repositories/admin.repository'
import CustomError from '../utils/customError'
import bcrypt from 'bcryptjs'

export class AuthService {
  private adminRepository: AdminRepository

  constructor() {
    this.adminRepository = new AdminRepository()
  }

  async signup(adminData: { phoneNumber: string; password: string; fullName: string; }) {
    try {
      const existingAdmin = await this.adminRepository.findByFilter({
        phoneNumber: adminData.phoneNumber
      })

      if (existingAdmin) {
        throw new CustomError('Phone number already exists', 409)
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 10)

      const formattedData = {
        fullName: adminData.fullName,
        phoneNumber: adminData.phoneNumber,
        password: hashedPassword,
        isSuperAdmin: false,
        verified: false
      }

      const result = await this.adminRepository.create(formattedData)
      const { password, ...adminWithoutPassword } = result
      return adminWithoutPassword
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async login(credentials: { phoneNumber: string; password: string }) {
    try {
      const admin = await this.adminRepository.findByFilter({
        phoneNumber: credentials.phoneNumber
      })

      if (!admin) {
        throw new CustomError('Invalid credentials', 401)
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, admin.password)

      if (!isPasswordValid) {
        throw new CustomError('Invalid credentials', 401)
      }

      const { password, ...adminWithoutPassword } = admin
      return adminWithoutPassword
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }
}
