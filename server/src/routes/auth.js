const express = require('express')
const router  = express.Router()
const authController = require('../controllers/authController')
const { auth }       = require('../middleware/auth')
const validate       = require('../middleware/validate')
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePreferencesSchema,
} = require('../validators')

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out successfully' }))
router.post('/reset-password', authController.resetPassword)
router.get('/me', auth, authController.getMe)
router.post('/profile/sync-resume', auth, authController.syncResume)
router.patch('/profile', auth, validate(updateProfileSchema), authController.updateProfile)
router.patch('/preferences', auth, validate(updatePreferencesSchema), authController.updatePreferences)

module.exports = router
