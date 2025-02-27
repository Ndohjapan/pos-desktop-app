//@ts-nocheck
import { Router } from 'express'
import { CategoryService } from '../services/category.service'
import protect from '../middleware/protect'

const router = Router()
const categoryService = new CategoryService()

router.get('/', async (req, res) => {
  const foods = await categoryService.getAllCategories()
  res.json(foods)
})

router.post('/', protect, async (req, res) => {
  try {
    const food = await categoryService.createCategory(req.body)
    res.status(201).json(food)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

export default router
