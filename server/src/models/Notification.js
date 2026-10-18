const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['job_match', 'deadline_reminder', 'application_update', 'career_tip', 'system'],
    default: 'system',
    index: true,
  },
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed },
  isRead:  { type: Boolean, default: false, index: true },
  readAt:  { type: Date },
  channel: { type: String, enum: ['in_app', 'email', 'push', 'all'], default: 'in_app' },
  deliveryStatus: {
    email: { sent: Boolean, deliveredAt: Date, error: String },
    push:  { sent: Boolean, deliveredAt: Date, error: String },
  },
}, { timestamps: true })

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
