import { Router } from 'express'
import { OrderService } from '../services/order.service'
import protect from '../middleware/protect'

const router = Router()
const orderService = new OrderService()

router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const date = req.query.date
    const searchQuery = req.query.searchQuery
    let orders

    if (searchQuery) {
      orders = await orderService.searchOrders(page, limit, date, searchQuery)
      return res.json(orders)
    }

    if (date) {
      orders = await orderService.getOrdersByDate(page, limit, date)
      return res.json(orders)
    }

    orders = await orderService.getAllOrders(page, limit)
    res.json(orders)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body)
    res.status(201).json(order)
  } catch (error) {
    res.status(error.code).json({ message: error.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await orderService.deleteOrder(req.params.id)
    res.status(201).json(order)
  } catch (error) {
    console.log(error)
    res.status(error.code).json({ message: error.message })
  }
})

export default router
