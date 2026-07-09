import { Router } from 'express'
import { shiftService } from '../services/shift.service'
import { sendError } from '../utils/errors'

const router = Router()

// Open (or resume) a shift for a cashier with an opening cash float.
router.post('/open', (req, res) => {
  try {
    const shift = shiftService.open(
      Number(req.body?.cashierId),
      Number(req.body?.openingFloat) || 0
    )
    res.status(201).json({ data: shift })
  } catch (error) {
    sendError(res, error)
  }
})

// The cashier's currently-open shift (null when none).
router.get('/current/:cashierId', (req, res) => {
  try {
    res.json({ data: shiftService.current(Number(req.params.cashierId)) })
  } catch (error) {
    sendError(res, error)
  }
})

// X report — live totals without closing.
router.get('/:id/report', (req, res) => {
  try {
    res.json({ data: shiftService.report(Number(req.params.id)) })
  } catch (error) {
    sendError(res, error)
  }
})

// Z report — count the drawer and close the shift.
router.post('/:id/close', (req, res) => {
  try {
    const report = shiftService.close(
      Number(req.params.id),
      Number(req.body?.countedCash) || 0,
      req.body?.notes ? String(req.body.notes) : null
    )
    res.json({ data: report })
  } catch (error) {
    sendError(res, error)
  }
})

router.get('/', (_req, res) => {
  try {
    res.json({ data: shiftService.recent() })
  } catch (error) {
    sendError(res, error)
  }
})

export default router
