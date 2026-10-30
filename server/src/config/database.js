const dns      = require('dns')
const mongoose = require('mongoose')
const config   = require('./index')
const logger   = require('../utils/logger')

// Fix for Node.js querySrv ECONNREFUSED on networks with DNS servers that fail SRV lookups
try {
  dns.setServers(['8.8.8.8', '8.8.4.4'])
} catch (e) {
  logger.warn(`Could not configure fallback DNS servers: ${e.message}`)
}

let isConnected = false

async function connectDB() {
  if (isConnected) return
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    logger.info(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`)
    throw err
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`)
})

module.exports = { connectDB, mongoose }
