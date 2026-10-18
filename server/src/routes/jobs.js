const express        = require('express')
const router         = express.Router()
const jobController  = require('../controllers/jobController')
const { auth, optionalAuth } = require('../middleware/auth')

router.get('/', optionalAuth, jobController.listJobs)
router.get('/matches', auth, jobController.getMatches)
router.post('/discover', auth, jobController.triggerDiscovery)
router.get('/:id', optionalAuth, jobController.getJobById)
router.post('/:id/match', auth, jobController.computeMatch)

module.exports = router
