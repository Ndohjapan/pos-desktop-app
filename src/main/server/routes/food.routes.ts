//@ts-nocheck
import { Router } from 'express'
import { FoodService } from '../services/food.service'

const router = Router()
const foodService = new FoodService()

router.get('/', async (req, res) => {
  const foods = await foodService.getAllFoods()
  res.json(foods)
})

router.post('/', async (req, res) => {
  try {
    const food = await foodService.createFood(req.body)
    res.status(201).json(food)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

export default router
