const jwt    = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User   = require('../models/User')
const config = require('../config')

function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiry })
}

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, currentStatus, role } = req.body

      const existing = await User.findOne({ email })
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
      }

      const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds || 12)
      const user = await User.create({
        name,
        email,
        passwordHash,
        currentStatus: currentStatus || role || 'Student',
        preferences: {
          targetRoles: ['Full Stack Developer', 'Frontend Engineer'],
          workModes: ['Remote', 'Hybrid'],
          jobTypes: ['Full-time', 'Internship'],
          minMatchScore: 60,
          jobMatchAlerts: true,
          discoveryEnabled: true,
        },
      })

      const token = generateToken(user._id)
      const userData = user.toSafeJSON()
      return res.status(201).json({
        success: true,
        data: {
          token,
          user: userData,
        },
        token,
        user: userData,
      })
    } catch (err) {
      next(err)
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' })
      }

      const match = await user.comparePassword(password)
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' })
      }

      user.lastLoginAt = new Date()
      await user.save()

      const token = generateToken(user._id)
      const userData = user.toSafeJSON()
      return res.json({
        success: true,
        data: {
          token,
          user: userData,
        },
        token,
        user: userData,
      })
    } catch (err) {
      next(err)
    }
  },

  async logout(req, res) {
    return res.json({ success: true, message: 'Logged out successfully' })
  },

  async getMe(req, res, next) {
    try {
      // Auto-fill profile from primary resume if user has uploaded one
      const Resume = require('../models/Resume')
      const resumeService = require('../services/resumeService')
      const primaryResume = await Resume.findOne({ userId: req.user._id, isPrimary: true })
        || await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 })

      if (primaryResume) {
        await resumeService.applyResumeToUser(req.user, primaryResume)
      }

      const userData = req.user.toSafeJSON()
      return res.json({
        success: true,
        data: userData,
        user: userData,
      })
    } catch (err) {
      next(err)
    }
  },

  async syncResume(req, res, next) {
    try {
      const Resume = require('../models/Resume')
      const resumeService = require('../services/resumeService')
      const primaryResume = await Resume.findOne({ userId: req.user._id, isPrimary: true })
        || await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 })

      if (!primaryResume) {
        return res.status(404).json({ success: false, message: 'No resume found to sync from' })
      }

      await resumeService.applyResumeToUser(req.user, primaryResume)

      const userData = req.user.toSafeJSON()
      return res.json({
        success: true,
        message: 'Profile synchronized with resume details',
        data: userData,
        user: userData,
      })
    } catch (err) {
      next(err)
    }
  },

  async updateProfile(req, res, next) {
    try {
      const allowed = ['name', 'currentStatus', 'phone', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'bio']
      allowed.forEach(field => {
        if (req.body[field] !== undefined) {
          req.user[field] = req.body[field]
        }
      })

      await req.user.save()
      const userData = req.user.toSafeJSON()
      return res.json({
        success: true,
        data: userData,
        user: userData,
      })
    } catch (err) {
      next(err)
    }
  },

  async updatePreferences(req, res, next) {
    try {
      req.user.preferences = {
        ...req.user.preferences.toObject(),
        ...req.body,
      }

      await req.user.save()
      return res.json({
        success: true,
        data: req.user.preferences,
        preferences: req.user.preferences,
      })
    } catch (err) {
      next(err)
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, newPassword } = req.body
      if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password are required.' })
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' })
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() })
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email address.' })
      }

      user.passwordHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds || 12)
      await user.save()

      return res.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
      })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = authController
