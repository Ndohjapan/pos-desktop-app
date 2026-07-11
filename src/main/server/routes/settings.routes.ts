import { Router } from 'express'
import { settingsRepository } from '../database/repositories/settings.repository'
import { sendError } from '../utils/errors'
import CustomError from '../utils/customError'
import protect from '../middleware/protect'

const router = Router()

// Walk-in-type stores run in quick-service mode (kitchen queue, big ticket
// numbers, daily summary); the sit-down restaurant does not. Deriving the mode
// from the branch keeps them in sync, so the Queue can never show in Restaurant
// mode. Add future quick-service branch ids here.
const QUICK_SERVICE_BRANCHES = new Set(['walk-in-store'])

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
    // Branch identity is set only via the one-time setup flow below, never here.
    const body = { ...(req.body ?? {}) }
    delete body.branchId
    delete body.branchName
    delete body.branchConfigured
    const updated = settingsRepository.update(body)
    res.json({ data: updated })
  } catch (error) {
    sendError(res, error)
  }
})

// First-time setup: pick this machine's store. Unauthenticated because it runs
// before any admin exists — but it LOCKS after the first successful call, so
// the branch can never be changed casually afterwards.
router.post('/setup-branch', (req, res) => {
  try {
    const current = settingsRepository.getAll()
    if (current.branchConfigured) {
      throw new CustomError('This store has already been set up', 409)
    }
    const branchId = String(req.body?.branchId ?? '').trim()
    const branchName = String(req.body?.branchName ?? '').trim()
    if (!branchId || !branchName) {
      throw new CustomError('Please select a store', 400)
    }
    // Set the operating mode from the branch so they can't drift out of sync.
    const quickService = QUICK_SERVICE_BRANCHES.has(branchId)
    const updated = settingsRepository.update({
      branchId,
      branchName,
      branchConfigured: true,
      quickService
    })
    res.json({ data: updated })
  } catch (error) {
    sendError(res, error)
  }
})

export default router
