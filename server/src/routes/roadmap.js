const express           = require('express')
const router            = express.Router()
const roadmapController = require('../controllers/roadmapController')
const { auth }          = require('../middleware/auth')

router.get('/', auth, roadmapController.getRoadmap)
router.post('/generate', auth, roadmapController.generateRoadmap)
router.patch('/milestones/:milestoneId', auth, roadmapController.updateMilestoneStatus)

module.exports = router
