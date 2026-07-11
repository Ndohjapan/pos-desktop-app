import { Router } from 'express'
import { cashierService } from '../services/cashier.service'
import { sendError } from '../utils/errors'
import protect from '../middleware/protect'

const router = Router()

// Public: the till's cashier picker (names + roles only, no PINs).
router.get('/', (_req, res) => {
  try {
    res.json({ data: cashierService.listActive() })
  } catch (error) {
    sendError(res, error)
  }
})

// Cashier PIN login at the till.
router.post('/login', async (req, res) => {
  try {
    const cashier = await cashierService.login(
      Number(req.body?.cashierId),
      String(req.body?.pin ?? '')
    )
    res.json({ data: cashier })
  } catch (error) {
    sendError(res, error)
  }
})

// Supervisor PIN check for voids/discounts. Returns the approver's identity.
router.post('/verify-supervisor', async (req, res) => {
  try {
    const supervisor = await cashierService.verifySupervisor(
      String(req.body?.pin ?? ''),
      String(req.body?.context ?? 'unspecified')
    )
    res.json({ data: supervisor })
  } catch (error) {
    sendError(res, error)
  }
})

// --- Owner-managed CRUD ---

router.get('/all', protect, (_req, res) => {
  try {
    res.json({ data: cashierService.listAll() })
  } catch (error) {
    sendError(res, error)
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const cashier = await cashierService.create(req.body)
    res.status(201).json({ data: cashier })
  } catch (error) {
    sendError(res, error)
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const cashier = await cashierService.update(Number(req.params.id), req.body)
    res.json({ data: cashier })
  } catch (error) {
    sendError(res, error)
  }
})

export default router
