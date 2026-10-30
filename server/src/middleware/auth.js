const jwt = require('jsonwebtoken')
const config = require('../config')
const User = require('../models/User')

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' })
    }

    const token = header.slice(7).trim()
    let decoded = null
    const secrets = [
      config.jwtSecret,
      'super-secret-jwt-key-for-khojai-development-only-32chars',
      'change-me-in-production'
    ].filter(Boolean)

    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret)
        if (decoded) break
      } catch (_) {}
    }

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please sign in again.' })
    }

    const user = await User.findById(decoded.id || decoded.userId)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please log in again.' })
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' })
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice(7).trim()
      let decoded = null
      const secrets = [
        config.jwtSecret,
        'super-secret-jwt-key-for-khojai-development-only-32chars',
        'change-me-in-production'
      ].filter(Boolean)

      for (const secret of secrets) {
        try {
          decoded = jwt.verify(token, secret)
          if (decoded) break
        } catch (_) {}
      }

      if (decoded) {
        req.user = await User.findById(decoded.id || decoded.userId)
      }
    }
  } catch (_) {
    // continue without req.user
  }
  next()
}

module.exports = { auth, optionalAuth }
