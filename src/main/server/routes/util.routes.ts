//@ts-nocheck
import { Router } from 'express'
import { UtilService } from '../services/util.service'

const router = Router()
const utilService = new UtilService()

router.get('/food-and-categoories', async (req, res) => {
  try {
    const result = await utilService.getAllFoodsAndCategories()
    res.json(result)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

router.get('/backup-orders', async (req, res) => {
  try {
    const result = await utilService.uploadOrdersToCloud()
    res.json(result)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

export default router
