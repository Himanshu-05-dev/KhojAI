const Notification = require('../models/Notification')
const User         = require('../models/User')
const logger       = require('../utils/logger')
const config       = require('../config')

let webPush = null
let nodemailer = null
let transporter = null

try {
  webPush = require('web-push')
  if (config.vapidPublicKey && config.vapidPrivateKey) {
    webPush.setVapidDetails(
      config.vapidEmail,
      config.vapidPublicKey,
      config.vapidPrivateKey
    )
  }
} catch (_) {
  // web-push optional
}

try {
  nodemailer = require('nodemailer')
  if (config.smtpHost && config.smtpUser) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }
} catch (_) {
  // nodemailer optional
}

const notificationService = {
  async sendNotification({ userId, type = 'system', title, message, data = {}, channel = 'in_app' }) {
    try {
      const user = await User.findById(userId)
      if (!user) return null

      // Check quiet hours if enabled
      if (user.preferences?.quietHoursEnabled && user.preferences?.quietStart && user.preferences?.quietEnd) {
        const now = new Date()
        const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const { quietStart, quietEnd } = user.preferences
        const inQuietHours = quietStart <= quietEnd
          ? (currentHourMin >= quietStart && currentHourMin <= quietEnd)
          : (currentHourMin >= quietStart || currentHourMin <= quietEnd)

        if (inQuietHours && type !== 'system') {
          logger.info(`Notification withheld during quiet hours for user ${userId}`)
          // We still create the in-app notification record, but skip external push/email
          channel = 'in_app'
        }
      }

      const notif = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        channel,
      })

      // Send email if enabled and requested
      if ((channel === 'email' || channel === 'all') && user.preferences?.emailEnabled && transporter) {
        try {
          await transporter.sendMail({
            from: config.smtpFrom,
            to: user.email,
            subject: `[KhojAI] ${title}`,
            text: message,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
                <h2 style="color: #6366f1;">KhojAI Career Notification</h2>
                <h3 style="color: #e2e8f0;">${title}</h3>
                <p style="color: #94a3b8; font-size: 16px; line-height: 1.5;">${message}</p>
                <div style="margin-top: 24px;">
                  <a href="${config.clientUrl}/inbox" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in KhojAI</a>
                </div>
              </div>
            `,
          })
          notif.deliveryStatus = notif.deliveryStatus || {}
          notif.deliveryStatus.email = { sent: true, deliveredAt: new Date() }
          await notif.save()
        } catch (emailErr) {
          logger.warn(`Failed to send email notification to ${user.email}: ${emailErr.message}`)
        }
      }

      return notif
    } catch (err) {
      logger.error(`Error sending notification: ${err.message}`)
      throw err
    }
  },

  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false, unread, type } = {}) {
    const query = { userId }
    const isUnread = unreadOnly === true || unreadOnly === 'true' || unread === true || unread === 'true'
    if (isUnread) query.isRead = false
    if (type && type !== 'all') {
      const t = String(type).toLowerCase().replace(/[\s-]/g, '_')
      if (t.includes('job') || t.includes('match')) query.type = 'job_match'
      else if (t.includes('deadline')) query.type = 'deadline_reminder'
      else if (t.includes('app')) query.type = 'application_update'
      else if (t.includes('tip')) query.type = 'career_tip'
      else if (t.includes('system')) query.type = 'system'
      else query.type = t
    }

    const skip = (page - 1) * limit
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ])

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    }
  },

  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, isRead: false })
  },

  async markAsRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    )
  },

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    )
  },

  async deleteNotification(userId, notificationId) {
    return Notification.findOneAndDelete({ _id: notificationId, userId })
  },
}

module.exports = notificationService
