const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true, maxlength: 120 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:  { type: String },
  role:          { type: String, enum: ['user', 'admin'], default: 'user' },
  currentStatus: { type: String, enum: ['Student','Fresher','Working Professional','Career Switcher','Other'], default: 'Student' },
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt:   { type: Date },
  preferences: {
    targetRoles:    [String],
    locations:      [String],
    jobTypes:       [String],
    workModes:      [String],
    minSalary:      { type: Number },
    jobMatchAlerts: { type: Boolean, default: true },
    deadlineReminders: { type: Boolean, default: true },
    systemUpdates:  { type: Boolean, default: true },
    weeklyDigest:   { type: Boolean, default: false },
    emailEnabled:   { type: Boolean, default: false },
    emailDigest:    { type: Boolean, default: false },
    pushEnabled:    { type: Boolean, default: false },
    minMatchScore:  { type: Number, default: 60, min: 0, max: 100 },
    quietHoursEnabled: { type: Boolean, default: false },
    quietStart:     { type: String, default: '22:00' },
    quietEnd:       { type: String, default: '08:00' },
    discoveryEnabled: { type: Boolean, default: true },
    discoveryFrequency: { type: String, enum: ['hourly','daily','weekly'], default: 'daily' },
  },
  phone:        { type: String },
  linkedinUrl:  { type: String },
  githubUrl:    { type: String },
  portfolioUrl: { type: String },
  bio:          { type: String, maxlength: 500 },
}, { timestamps: true })

const config   = require('../config')

userSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash') || !this.passwordHash) return
  // Only hash if it looks like a plain password (not already hashed)
  if (this.passwordHash.startsWith('$2')) return
  this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcryptSaltRounds || 12)
})

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

module.exports = mongoose.model('User', userSchema)
