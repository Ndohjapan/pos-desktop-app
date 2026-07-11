import { Router } from 'express'
import { CategoryService } from '../services/category.service'
import protect from '../middleware/protect'
import { sendError } from '../utils/errors'

const router = Router()
const categoryService = new CategoryService()

router.get('/', async (_req, res) => {
  const categories = await categoryService.getAllCategories()
  res.json(categories)
})

router.post('/', protect, async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body)
    res.status(201).json(category)
  } catch (error) {
    sendError(res, error)
  }
})

export default router
