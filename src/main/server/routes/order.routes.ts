//@ts-nocheck
import { Router } from 'express'
import { OrderService } from '../services/order.service'
import CustomError from '../utils/customError'

const router = Router()
const orderService = new OrderService()

router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const date = req.query.date
    let orders

    if (date) {
      orders = await orderService.getOrdersByDate(page, limit, date)
      return res.json(orders)
    }

    orders = await orderService.getAllOrders(page, limit)
    res.json(orders)
  } catch (error) {
    throw new CustomError(error.message, error.code || 400)
  }
})

router.post('/', async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body)
    res.status(201).json(order)
  } catch (error) {
    throw new CustomError(error.message, error.code || 400)
  }
})

export default router
