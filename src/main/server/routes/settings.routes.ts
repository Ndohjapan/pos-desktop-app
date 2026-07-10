import { Router } from 'express'
import { settingsRepository } from '../database/repositories/settings.repository'
import { sendError } from '../utils/errors'
import CustomError from '../utils/customError'
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
    const updated = settingsRepository.update({ branchId, branchName, branchConfigured: true })
    res.json({ data: updated })
  } catch (error) {
    sendError(res, error)
  }
})

export default router
