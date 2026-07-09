import bcrypt from 'bcryptjs'
import { cashierRepository } from '../database/repositories/cashier.repository'
import { auditRepository } from '../database/repositories/audit.repository'
import CustomError from '../utils/customError'
import { toCustomError } from '../utils/errors'
import { CashierPublic, CashierRole, CashierRow } from '../types'

function toPublic(cashier: CashierRow): CashierPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pin, ...rest } = cashier
  return rest
}

function assertValidPin(pin: string): void {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new CustomError('PIN must be 4-6 digits', 400)
  }
}

export class CashierService {
  async create(data: { fullName: string; pin: string; role?: CashierRole }): Promise<CashierPublic> {
    try {
      if (!data.fullName?.trim()) throw new CustomError('Name is required', 400)
      assertValidPin(data.pin)
      const hashed = await bcrypt.hash(data.pin, 10)
      const cashier = cashierRepository.create({
        fullName: data.fullName.trim(),
        pin: hashed,
        role: data.role === 'supervisor' ? 'supervisor' : 'cashier'
      })
      return toPublic(cashier)
    } catch (error) {
      throw toCustomError(error)
    }
  }

  async update(
    id: number,
    data: { fullName?: string; pin?: string; role?: CashierRole; active?: boolean }
  ): Promise<CashierPublic> {
    try {
      const existing = cashierRepository.findById(id)
      if (!existing) throw new CustomError('Cashier not found', 404)

      const patch: Partial<{ fullName: string; pin: string; role: CashierRole; active: 0 | 1 }> = {}
      if (data.fullName !== undefined) patch.fullName = data.fullName.trim()
      if (data.role !== undefined) patch.role = data.role === 'supervisor' ? 'supervisor' : 'cashier'
      if (data.active !== undefined) patch.active = data.active ? 1 : 0
      if (data.pin !== undefined && data.pin !== '') {
        assertValidPin(data.pin)
        patch.pin = await bcrypt.hash(data.pin, 10)
      }

      cashierRepository.update(id, patch)
      return toPublic(cashierRepository.findById(id) as CashierRow)
    } catch (error) {
      throw toCustomError(error)
    }
  }

  // Public list for the till's cashier picker (no PINs).
  listActive(): CashierPublic[] {
    return cashierRepository.findActive().map(toPublic)
  }

  listAll(): CashierPublic[] {
    return cashierRepository.findAll().map(toPublic)
  }

  // Cashier picks their name and enters their PIN.
  async login(cashierId: number, pin: string): Promise<CashierPublic> {
    try {
      const cashier = cashierRepository.findById(cashierId)
      if (!cashier || !cashier.active) throw new CustomError('Cashier not found', 404)
      const ok = await bcrypt.compare(pin, cashier.pin)
      if (!ok) throw new CustomError('Incorrect PIN', 401)
      return toPublic(cashier)
    } catch (error) {
      throw toCustomError(error, 401)
    }
  }

  /**
   * Supervisor approval for sensitive actions (voids, discounts): any active
   * supervisor's PIN unlocks. Returns the approving supervisor's name for the
   * audit trail. Every failed attempt is also audited.
   */
  async verifySupervisor(pin: string, context: string): Promise<CashierPublic> {
    const supervisors = cashierRepository
      .findActive()
      .filter((cashier) => cashier.role === 'supervisor')

    if (supervisors.length === 0) {
      throw new CustomError('No supervisor accounts configured — add one in Admin > Staff', 400)
    }

    for (const supervisor of supervisors) {
      if (await bcrypt.compare(pin, supervisor.pin)) {
        return toPublic(supervisor)
      }
    }

    auditRepository.log({
      action: 'supervisor-approval-failed',
      reason: context
    })
    throw new CustomError('Supervisor PIN not recognized', 401)
  }
}

export const cashierService = new CashierService()
