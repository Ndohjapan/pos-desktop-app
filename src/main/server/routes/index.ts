import { Router } from 'express'
import foodRoutes from './food.routes'
import categoryRoutes from './category.routes'
import orderRoutes from './order.routes'
import utilRoutes from './util.routes'

const router = Router()

router.use('/foods', foodRoutes)
router.use('/categories', categoryRoutes)
router.use('/orders', orderRoutes)
router.use('/utils', utilRoutes)

export default router
