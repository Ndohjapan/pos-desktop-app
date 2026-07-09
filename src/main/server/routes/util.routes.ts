import { Router } from 'express'
import { UtilService } from '../services/util.service'
import { sendError } from '../utils/errors'

const router = Router()
const utilService = new UtilService()

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

export default router
