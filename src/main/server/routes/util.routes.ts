import { Router } from 'express'
import { utilService } from '../services/util.service'
import { sendError } from '../utils/errors'

const router = Router()

router.get('/food-and-categoories', async (_req, res) => {
  try {
    const result = await utilService.backupFoods()
    res.json(result)
  } catch (error) {
    sendError(res, error)
  }
})

router.get('/backup-orders', async (_req, res) => {
  try {
    const result = await utilService.uploadOrdersToCloud()
    res.json(result)
  } catch (error) {
    sendError(res, error)
  }
})

// Live sync status for the dashboard indicator.
router.get('/sync-status', async (_req, res) => {
  try {
    const status = await utilService.getStatus()
    res.json(status)
  } catch (error) {
    sendError(res, error)
  }
})

// Re-queue previously-rejected orders for another upload attempt.
router.post('/retry-failed', async (_req, res) => {
  try {
    const result = await utilService.retryFailedOrders()
    res.json(result)
  } catch (error) {
    sendError(res, error)
  }
})

export default router
