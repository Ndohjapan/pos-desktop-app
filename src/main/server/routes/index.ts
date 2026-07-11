import { Router } from 'express'
import foodRoutes from './food.routes'
import categoryRoutes from './category.routes'
import orderRoutes from './order.routes'
import utilRoutes from './util.routes'
import authRoutes from './auth.routes'
import settingsRoutes from './settings.routes'
import cashierRoutes from './cashier.routes'
import shiftRoutes from './shift.routes'
import parkedRoutes from './parked.routes'

const router = Router()

router.use('/foods', foodRoutes)
router.use('/categories', categoryRoutes)
router.use('/orders', orderRoutes)
router.use('/utils', utilRoutes)
router.use('/auth', authRoutes)
router.use('/settings', settingsRoutes)
router.use('/cashiers', cashierRoutes)
router.use('/shifts', shiftRoutes)
router.use('/parked', parkedRoutes)

export default router
