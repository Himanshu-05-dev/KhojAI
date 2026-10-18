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

app.use(cors({
  origin: '*',
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

// Static files for uploaded resumes
app.use('/uploads', express.static(path.resolve(config.storageDir)))

// API version 1 routes
app.use('/api/v1', routes)

// 404 & Error handling
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
