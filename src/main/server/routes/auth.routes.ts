import { Router } from 'express'
import { AuthService } from '../services/auth.service'
import { sendError } from '../utils/errors'
import protect from '../middleware/protect'

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

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) await authService.logout(token)
    res.status(200).json({ success: true })
  } catch (error) {
    sendError(res, error)
  }
})

// --- Admin management (owner/super-admin only) ---

router.get('/admins', protect, async (_req, res) => {
  try {
    const admins = await authService.listAdmins()
    res.status(200).json({ data: admins })
  } catch (error) {
    sendError(res, error)
  }
})

router.post('/admins/:id/verify', protect, async (req, res) => {
  try {
    const result = await authService.setAdminVerified(
      Number(req.params.id),
      req.body?.verified !== false
    )
    res.status(200).json(result)
  } catch (error) {
    sendError(res, error)
  }
})

export default router
