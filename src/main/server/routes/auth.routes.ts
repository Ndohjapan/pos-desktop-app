import { Router } from 'express'
import { AuthService } from '../services/auth.service'
import { sendError } from '../utils/errors'

const router = Router()
const authService = new AuthService()

router.post('/signup', async (req, res) => {
  try {
    const admin = await authService.signup(req.body)
    res.status(201).json(admin)
  } catch (error) {
    sendError(res, error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const admin = await authService.login(req.body)
    res.status(200).json(admin)
  } catch (error) {
    sendError(res, error)
  }
})

export default router
