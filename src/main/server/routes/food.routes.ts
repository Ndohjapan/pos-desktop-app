import { Router } from 'express'
import { FoodService } from '../services/food.service'
import protect from '../middleware/protect'
import { sendError } from '../utils/errors'

const router = Router()
const foodService = new FoodService()

router.get('/', async (_req, res) => {
  const foods = await foodService.getAllFoods()
  res.json(foods)
})

router.post('/', protect, async (req, res) => {
  try {
    const food = await foodService.createFood(req.body)
    res.status(201).json(food)
  } catch (error) {
    sendError(res, error)
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const food = await foodService.updateFood(Number(req.params.id), req.body)
    res.status(200).json(food)
  } catch (error) {
    sendError(res, error)
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const food = await foodService.deleteFood(Number(req.params.id))
    res.status(200).json(food)
  } catch (error) {
    sendError(res, error)
  }
})

export default router
