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
      const { name, email, password, currentStatus } = req.body

      const existing = await User.findOne({ email })
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await User.create({
        name,
        email,
        passwordHash,
        currentStatus: currentStatus || 'Student',
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
      return res.status(201).json({
        success: true,
        token,
        user: user.toSafeJSON(),
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
      return res.json({
        success: true,
        token,
        user: user.toSafeJSON(),
      })
    } catch (err) {
      next(err)
    }
  },

  async getMe(req, res, next) {
    try {
      return res.json({
        success: true,
        user: req.user.toSafeJSON(),
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
      return res.json({
        success: true,
        user: req.user.toSafeJSON(),
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
        preferences: req.user.preferences,
      })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = authController
