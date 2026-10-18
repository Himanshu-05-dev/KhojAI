const notificationService = require('../services/notificationService')

const notificationController = {
  async listNotifications(req, res, next) {
    try {
      const result = await notificationService.getUserNotifications(req.user._id, req.query)
      return res.json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user._id)
      return res.json({ success: true, count })
    } catch (err) {
      next(err)
    }
  },

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.user._id, req.params.id)
      return res.json({ success: true, notification })
    } catch (err) {
      next(err)
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user._id)
      return res.json({ success: true, message: 'All notifications marked as read' })
    } catch (err) {
      next(err)
    }
  },

  async deleteNotification(req, res, next) {
    try {
      await notificationService.deleteNotification(req.user._id, req.params.id)
      return res.json({ success: true, message: 'Notification deleted' })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = notificationController
