import { Router } from 'express'
import { OrderService } from '../services/order.service'
import protect from '../middleware/protect'
import { sendError } from '../utils/errors'

const router = Router()
const orderService = new OrderService()

router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const date = typeof req.query.date === 'string' ? req.query.date : undefined
    const searchQuery =
      typeof req.query.searchQuery === 'string' ? req.query.searchQuery : undefined
    let orders

    if (searchQuery && date) {
      orders = await orderService.searchOrders(page, limit, date, searchQuery)
      return res.json(orders)
    }

    if (date) {
      orders = await orderService.getOrdersByDate(page, limit, date)
      return res.json(orders)
    }

    orders = await orderService.getAllOrders(page, limit)
    return res.json(orders)
  } catch (error) {
    return sendError(res, error)
  }
})

router.post('/', async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body)
    res.status(201).json(order)
  } catch (error) {
    sendError(res, error)
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await orderService.deleteOrder(String(req.params.id))
    res.status(201).json(order)
  } catch (error) {
    console.log(error)
    sendError(res, error)
  }
})

export default router
