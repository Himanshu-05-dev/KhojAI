const express          = require('express')
const router           = express.Router()
const resumeController = require('../controllers/resumeController')
const { auth }         = require('../middleware/auth')
const upload           = require('../middleware/upload')

router.post('/upload', auth, upload.single('resume'), resumeController.uploadResume)
router.post('/', auth, upload.single('resume'), resumeController.uploadResume)
router.get('/', auth, resumeController.getResume)
router.get('/:id', auth, resumeController.getResume)
router.post('/:id/analyze', auth, resumeController.analyzeResume)
router.patch('/:id', auth, resumeController.updateProfile)
router.patch('/:id/profile', auth, resumeController.updateProfile)
router.delete('/:id', auth, resumeController.deleteResume)

module.exports = router
