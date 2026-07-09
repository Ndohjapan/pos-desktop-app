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

// Today's kitchen queue (paid, not yet served).
router.get('/queue', (_req, res) => {
  try {
    res.json({ data: orderService.getQueue() })
  } catch (error) {
    sendError(res, error)
  }
})

// On-device daily summary (?date=YYYY-MM-DD, default today).
router.get('/summary', (req, res) => {
  try {
    const date =
      typeof req.query.date === 'string' && req.query.date
        ? req.query.date
        : new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    res.json({ data: orderService.getDailySummary(date) })
  } catch (error) {
    sendError(res, error)
  }
})

// Void with supervisor approval + reason (audited).
router.post('/:id/void', async (req, res) => {
  try {
    const order = await orderService.voidOrder(
      Number(req.params.id),
      String(req.body?.reason ?? ''),
      String(req.body?.supervisorPin ?? ''),
      req.body?.cashierName ? String(req.body.cashierName) : undefined
    )
    res.json({ data: order })
  } catch (error) {
    sendError(res, error)
  }
})

// Advance an order through the kitchen queue.
router.patch('/:id/fulfillment', (req, res) => {
  try {
    const order = orderService.setFulfillment(
      Number(req.params.id),
      String(req.body?.fulfillment ?? '')
    )
    res.json({ data: order })
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
