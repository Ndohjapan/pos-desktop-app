import { Router } from 'express'
import { FoodService } from '../services/food.service'
import protect from '../middleware/protect'

const router = Router()
const foodService = new FoodService()

router.get('/', async (req, res) => {
  const foods = await foodService.getAllFoods()
  res.json(foods)
})

router.post('/', protect, async (req, res) => {
  try {
    const food = await foodService.createFood(req.body)
    res.status(201).json(food)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const food = await foodService.updateFood(req.params.id, req.body)
    res.status(200).json(food)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const food = await foodService.deleteFood(req.params.id)
    res.status(200).json(food)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

export default router
