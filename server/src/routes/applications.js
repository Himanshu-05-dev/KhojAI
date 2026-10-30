const express               = require('express')
const router                = express.Router()
const applicationController = require('../controllers/applicationController')
const { auth }              = require('../middleware/auth')
const validate              = require('../middleware/validate')
const {
  createApplicationSchema,
  updateApplicationSchema,
} = require('../validators')

router.get('/', auth, applicationController.listApplications)
router.post('/auto-sync', auth, applicationController.autoSyncApplications)
router.post('/parse-email', auth, applicationController.parseEmailAndUpdate)
router.get('/:id', auth, applicationController.getApplicationById)
router.post('/', auth, validate(createApplicationSchema), applicationController.createApplication)
router.patch('/:id', auth, validate(updateApplicationSchema), applicationController.updateApplication)
router.delete('/:id', auth, applicationController.deleteApplication)

module.exports = router
