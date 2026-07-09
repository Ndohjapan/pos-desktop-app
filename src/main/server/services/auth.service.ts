import { AdminRepository } from '../database/repositories/admin.repository'
import { SessionRepository } from '../database/repositories/session.repository'
import CustomError from '../utils/customError'
import { toCustomError } from '../utils/errors'
import { LoginInput, SignupInput } from '../types'
import bcrypt from 'bcryptjs'

export class AuthService {
  private adminRepository: AdminRepository
  private sessionRepository: SessionRepository

  constructor() {
    this.adminRepository = new AdminRepository()
    this.sessionRepository = new SessionRepository()
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
        // Owner is auto-verified; additional staff must be verified by the owner
        // before they can log in.
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

      // Enforce the verified flag — unverified staff accounts cannot log in
      // until the owner approves them.
      if (!admin.verified) {
        throw new CustomError('Account is awaiting approval by the owner', 403)
      }

      // Issue a real, unguessable, expiring session token (replaces the old
      // "token = admin row id" scheme).
      this.sessionRepository.purgeExpired()
      const token = this.sessionRepository.create(admin.id)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...adminWithoutPassword } = admin
      return { ...adminWithoutPassword, token }
    } catch (error) {
      throw toCustomError(error, 401)
    }
  }

  async logout(token: string): Promise<void> {
    this.sessionRepository.delete(token)
  }

  // --- Admin management (super-admin only, enforced at the route) ---

  async listAdmins() {
    const admins = await this.adminRepository.findAll()
    // Never leak password hashes.
    return admins.map(({ password: _password, ...rest }) => rest)
  }

  async setAdminVerified(id: number, verified: boolean) {
    const admin = await this.adminRepository.findById(id)
    if (!admin) throw new CustomError('Admin not found', 404)
    if (admin.isSuperAdmin && !verified) {
      throw new CustomError('The owner account cannot be unverified', 400)
    }
    await this.adminRepository.setVerified(id, verified)
    return { success: true }
  }
}
