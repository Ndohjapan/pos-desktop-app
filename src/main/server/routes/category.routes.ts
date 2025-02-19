//@ts-nocheck
import { Router } from 'express'
import { CategoryService } from '../services/category.service'

const router = Router()
const categoryService = new CategoryService()

router.get('/', async (req, res) => {
  const foods = await categoryService.getAllCategories()
  res.json(foods)
})

router.post('/', async (req, res) => {
  try {
    const food = await categoryService.createCategory(req.body)
    res.status(201).json(food)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

export default router
