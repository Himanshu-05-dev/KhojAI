const express                = require('express')
const router                 = express.Router()
const notificationController = require('../controllers/notificationController')
const { auth }               = require('../middleware/auth')

router.get('/', auth, notificationController.listNotifications)
router.get('/unread-count', auth, notificationController.getUnreadCount)
router.patch('/read-all', auth, notificationController.markAllAsRead)
router.post('/read-all', auth, notificationController.markAllAsRead)
router.patch('/:id/read', auth, notificationController.markAsRead)
router.post('/:id/read', auth, notificationController.markAsRead)
router.delete('/:id', auth, notificationController.deleteNotification)

module.exports = router
