import { AdminRepository } from '../database/repositories/admin.repository'
import CustomError from '../utils/customError'
import { getErrorMessage, toCustomError } from '../utils/errors'
import { LoginInput, SignupInput } from '../types'
import bcrypt from 'bcryptjs'

export class AuthService {
  private adminRepository: AdminRepository

  constructor() {
    this.adminRepository = new AdminRepository()
  }

  async signup(adminData: SignupInput) {
    try {
      const existingAdmin = await this.adminRepository.findByFilter({
        phoneNumber: adminData.phoneNumber
      })

      if (existingAdmin) {
        throw new CustomError('Phone number already exists', 409)
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 10)

      // Bootstrap: while no super admin exists on this machine, the next admin
      // to register becomes the owner (super admin). Without this, no code path
      // ever grants isSuperAdmin, so every protected action (food/category CRUD,
      // order delete) returns 403 and the admin panel is permanently unusable.
      // Checking "no super admin exists" (rather than "no admins at all") also
      // self-heals existing installs whose admins were all created non-super.
      const superAdminExists = await this.adminRepository.findByFilter({ isSuperAdmin: 1 })
      const promoteToSuperAdmin = !superAdminExists

      const formattedData = {
        fullName: adminData.fullName,
        phoneNumber: adminData.phoneNumber,
        password: hashedPassword,
        isSuperAdmin: promoteToSuperAdmin,
        verified: promoteToSuperAdmin
      }

      const result = await this.adminRepository.create(formattedData)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...adminWithoutPassword } = result
      return adminWithoutPassword
    } catch (error) {
      throw toCustomError(error, 500)
    }
  }

  async login(credentials: LoginInput) {
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...adminWithoutPassword } = admin
      return adminWithoutPassword
    } catch (error) {
      throw new CustomError(getErrorMessage(error), toCustomError(error).code)
    }
  }
}
