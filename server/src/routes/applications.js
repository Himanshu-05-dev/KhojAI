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
router.get('/:id', auth, applicationController.getApplicationById)
router.post('/', auth, validate(createApplicationSchema), applicationController.createApplication)
router.patch('/:id', auth, validate(updateApplicationSchema), applicationController.updateApplication)
router.delete('/:id', auth, applicationController.deleteApplication)

module.exports = router
