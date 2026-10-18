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
router.get('/me', auth, authController.getMe)
router.patch('/profile', auth, validate(updateProfileSchema), authController.updateProfile)
router.patch('/preferences', auth, validate(updatePreferencesSchema), authController.updatePreferences)

module.exports = router
