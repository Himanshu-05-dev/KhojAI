const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const morgan   = require('morgan')
const path     = require('path')
const config   = require('./config')
const routes   = require('./routes')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')

const app = express()

// Security & utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// Robust CORS for Vercel, localhost, and custom domains
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true)

    if (
      config.nodeEnv !== 'production' ||
      config.clientUrl === '*' ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:')
    ) {
      return callback(null, true)
    }

    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-service-key'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

// Static files for uploaded resumes
app.use('/uploads', express.static(path.resolve(config.storageDir)))

// Root health & status route (for Render, uptime monitors, etc.)
app.get('/', (req, res) => {
  res.json({
    name: 'KhojAI Backend API',
    status: 'ok',
    environment: config.nodeEnv,
    version: '1.0.0',
    documentation: '/api/v1/health',
  })
})

// API version 1 routes
app.use('/api/v1', routes)

// 404 & Error handling
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app

