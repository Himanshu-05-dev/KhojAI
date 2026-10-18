const { Worker }          = require('bullmq')
const config              = require('../config')
const logger              = require('../utils/logger')
const { connectDB }       = require('../config/database')
const User                = require('../models/User')
const jobService          = require('../services/jobService')

async function startWorker() {
  await connectDB()
  logger.info('Worker connected to database.')

  const connection = {
    url: config.redisUrl,
    maxRetriesPerRequest: null,
  }

  const worker = new Worker('job-discovery', async (job) => {
    logger.info(`Processing background discovery job: ${job.id} for user ${job.data.userId}`)
    const user = await User.findById(job.data.userId)
    if (!user) {
      logger.warn(`User ${job.data.userId} not found for job ${job.id}`)
      return
    }

    const result = await jobService.runDiscoveryForUser(user)
    logger.info(`Discovery job ${job.id} completed: ${JSON.stringify(result)}`)
    return result
  }, { connection, concurrency: 5 })

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed with error: ${err.message}`)
  })

  logger.info('🚀 BullMQ Worker listening for job-discovery events...')
}

if (require.main === module) {
  startWorker().catch((err) => {
    logger.error(`Worker startup failed: ${err.message}`)
  })
}

module.exports = { startWorker }
