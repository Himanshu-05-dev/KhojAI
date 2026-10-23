const express       = require('express')
const router        = express.Router()

const authRoutes         = require('./auth')
const jobRoutes          = require('./jobs')
const resumeRoutes       = require('./resumes')
const applicationRoutes  = require('./applications')
const notificationRoutes = require('./notifications')
const roadmapRoutes      = require('./roadmap')

router.use('/auth', authRoutes)
router.use('/jobs', jobRoutes)
router.use('/resumes', resumeRoutes)
router.use('/resume', resumeRoutes)
router.use('/applications', applicationRoutes)
router.use('/notifications', notificationRoutes)
router.use('/roadmap', roadmapRoutes)
router.use('/career/roadmap', roadmapRoutes)

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KhojAI API',
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
