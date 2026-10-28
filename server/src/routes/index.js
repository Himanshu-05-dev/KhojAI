const express       = require('express')
const router        = express.Router()

const authRoutes         = require('./auth')
const jobRoutes          = require('./jobs')
const resumeRoutes       = require('./resumes')
const applicationRoutes  = require('./applications')
const notificationRoutes = require('./notifications')
const roadmapRoutes      = require('./roadmap')

const authController = require('../controllers/authController')
const { auth }       = require('../middleware/auth')
const validate       = require('../middleware/validate')
const { updateProfileSchema, updatePreferencesSchema } = require('../validators')

router.use('/auth', authRoutes)
router.use('/jobs', jobRoutes)
router.use('/resumes', resumeRoutes)
router.use('/resume', resumeRoutes)
router.use('/applications', applicationRoutes)
router.use('/notifications', notificationRoutes)
router.use('/roadmap', roadmapRoutes)
router.use('/career/roadmap', roadmapRoutes)

// Aliases for profile & preferences
router.get('/profile', auth, authController.getMe)
router.patch('/profile', auth, validate(updateProfileSchema), authController.updateProfile)
router.patch('/preferences', auth, validate(updatePreferencesSchema), authController.updatePreferences)
router.get('/notifications/preferences', auth, (req, res) => {
  res.json({ success: true, data: req.user.preferences || {} })
})
router.patch('/notifications/preferences', auth, validate(updatePreferencesSchema), authController.updatePreferences)

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KhojAI API',
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
