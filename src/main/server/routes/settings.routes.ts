import { Router } from 'express'
import { settingsRepository } from '../database/repositories/settings.repository'
import { sendError } from '../utils/errors'
import protect from '../middleware/protect'

const router = Router()

// Every till reads store settings on connect (branch, mode, printers).
router.get('/', (_req, res) => {
  try {
    res.json({ data: settingsRepository.getAll() })
  } catch (error) {
    sendError(res, error)
  }
})

// Only the owner (super admin) can change store configuration.
router.put('/', protect, (req, res) => {
  try {
    const updated = settingsRepository.update(req.body ?? {})
    res.json({ data: updated })
  } catch (error) {
    sendError(res, error)
  }
})

export default router
