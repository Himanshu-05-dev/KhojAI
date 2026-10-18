const app        = require('./app')
const config     = require('./config')
const logger     = require('./utils/logger')
const { connectDB } = require('./config/database')
const jobService = require('./services/jobService')

async function startServer() {
  try {
    // Attempt MongoDB connection
    try {
      await connectDB()
      // Seed default jobs if database is fresh
      await jobService.seedDefaultJobs()
    } catch (dbErr) {
      logger.warn(`Could not connect to MongoDB at ${config.mongoUri}: ${dbErr.message}. Running in offline/in-memory fallback mode.`)
    }

    const server = app.listen(config.port, () => {
      logger.info(`🚀 KhojAI Server running on port ${config.port} [${config.nodeEnv}]`)
      logger.info(`📡 API endpoint: http://localhost:${config.port}/api/v1`)
    })

    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, terminating gracefully...')
      server.close(() => {
        logger.info('Server closed.')
        process.exit(0)
      })
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`)
    process.exit(1)
  }
}

startServer()
