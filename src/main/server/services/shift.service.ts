import db from '../database/client'
import { shiftRepository } from '../database/repositories/shift.repository'
import { cashierRepository } from '../database/repositories/cashier.repository'
import { auditRepository } from '../database/repositories/audit.repository'
import CustomError from '../utils/customError'
import { toCustomError } from '../utils/errors'
import { ShiftReport, ShiftRow } from '../types'

interface PaymentAggRow {
  paymentMethod: string
  amount: number
  count: number
}

// Aggregate the sales that happened within a shift, straight from SQL.
function buildReport(shift: ShiftRow, countedCash: number | null): ShiftReport {
  const salesAgg = db
    .prepare(
      `SELECT COUNT(*) as orderCount,
              COALESCE(SUM(total), 0) as grossSales,
              COALESCE(SUM(discount), 0) as totalDiscount
       FROM "Order"
       WHERE shiftId = ? AND status = 'completed' AND isDeleted = 0`
    )
    .get(shift.id) as { orderCount: number; grossSales: number; totalDiscount: number }

  const voidAgg = db
    .prepare(
      `SELECT COUNT(*) as voidCount, COALESCE(SUM(total), 0) as voidedAmount
       FROM "Order"
       WHERE shiftId = ? AND status = 'voided'`
    )
    .get(shift.id) as { voidCount: number; voidedAmount: number }

  const byPaymentMethod = db
    .prepare(
      `SELECT p.paymentMethod as paymentMethod,
              COALESCE(SUM(p.amount), 0) as amount,
              COUNT(*) as count
       FROM OrderPayment p
       JOIN "Order" o ON o.id = p.orderId
       WHERE o.shiftId = ? AND o.status = 'completed' AND o.isDeleted = 0
       GROUP BY p.paymentMethod
       ORDER BY amount DESC`
    )
    .all(shift.id) as PaymentAggRow[]

  const cashSales =
    byPaymentMethod.find((row) => row.paymentMethod.toLowerCase() === 'cash')?.amount ?? 0

  const expectedCash = shift.openingFloat + cashSales
  const variance =
    countedCash === null ? null : Math.round((countedCash - expectedCash) * 100) / 100

  return {
    shift,
    orderCount: salesAgg.orderCount,
    grossSales: salesAgg.grossSales,
    totalDiscount: salesAgg.totalDiscount,
    voidCount: voidAgg.voidCount,
    voidedAmount: voidAgg.voidedAmount,
    byPaymentMethod,
    cashSales,
    expectedCash,
    countedCash,
    variance
  }
}

export class ShiftService {
  open(cashierId: number, openingFloat: number): ShiftRow {
    try {
      const cashier = cashierRepository.findById(cashierId)
      if (!cashier) throw new CustomError('Cashier not found', 404)

      const existing = shiftRepository.findOpenByCashier(cashierId)
      if (existing) {
        // Idempotent: opening while a shift is already open resumes it.
        return existing
      }

      const shift = shiftRepository.open(cashierId, cashier.fullName, openingFloat)
      auditRepository.log({
        action: 'shift-opened',
        cashierName: cashier.fullName,
        detail: `openingFloat=${openingFloat}`
      })
      return shift
    } catch (error) {
      throw toCustomError(error)
    }
  }

  current(cashierId: number): ShiftRow | null {
    return shiftRepository.findOpenByCashier(cashierId) ?? null
  }

  // X report: live snapshot of an open (or closed) shift, does not close it.
  report(shiftId: number): ShiftReport {
    const shift = shiftRepository.findById(shiftId)
    if (!shift) throw new CustomError('Shift not found', 404)
    return buildReport(shift, shift.countedCash)
  }

  // Z report: count the drawer, close the shift, return the final report.
  close(shiftId: number, countedCash: number, notes: string | null): ShiftReport {
    try {
      const shift = shiftRepository.findById(shiftId)
      if (!shift) throw new CustomError('Shift not found', 404)
      if (shift.closedAt) throw new CustomError('Shift is already closed', 400)

      const preview = buildReport(shift, countedCash)
      const closed = shiftRepository.close(shiftId, countedCash, preview.expectedCash, notes)

      auditRepository.log({
        action: 'shift-closed',
        cashierName: shift.cashierName,
        detail: `expected=${preview.expectedCash} counted=${countedCash} variance=${preview.variance}`
      })

      return buildReport(closed, countedCash)
    } catch (error) {
      throw toCustomError(error)
    }
  }

  recent(limit = 20): ShiftRow[] {
    return shiftRepository.findRecent(limit)
  }
}

export const shiftService = new ShiftService()
