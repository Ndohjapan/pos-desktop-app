import { Router } from 'express'
import { parkedOrderRepository } from '../database/repositories/parked-order.repository'
import { sendError } from '../utils/errors'
import CustomError from '../utils/customError'

const router = Router()

// All currently-parked orders (any till can list and resume them).
router.get('/', (_req, res) => {
  try {
    res.json({ data: parkedOrderRepository.findAll() })
  } catch (error) {
    sendError(res, error)
  }
})

// Park the current draft order under a label (customer name/table/etc).
router.post('/', (req, res) => {
  try {
    const { label, cashierId, cashierName, payload } = req.body ?? {}
    if (!payload) throw new CustomError('Missing order payload', 400)
    const parked = parkedOrderRepository.create({
      label: String(label || 'Held order'),
      cashierId: cashierId != null ? Number(cashierId) : null,
      cashierName: cashierName ? String(cashierName) : null,
      payload: JSON.stringify(payload)
    })
    res.status(201).json({ data: parked })
  } catch (error) {
    sendError(res, error)
  }
})

// Resume: fetch a parked order (kept until explicitly deleted or the resumed
// order is completed, so a crash mid-resume never loses the draft).
router.get('/:id', (req, res) => {
  try {
    const parked = parkedOrderRepository.findById(Number(req.params.id))
    if (!parked) throw new CustomError('Held order no longer exists', 404)
    res.json({ data: parked })
  } catch (error) {
    sendError(res, error)
  }
})

router.delete('/:id', (req, res) => {
  try {
    parkedOrderRepository.delete(Number(req.params.id))
    res.json({ success: true })
  } catch (error) {
    sendError(res, error)
  }
})

export default router
