const { Queue } = require('bullmq')
const config    = require('../config')
const logger    = require('../utils/logger')

let discoveryQueue = null

try {
  const connection = {
    url: config.redisUrl,
    maxRetriesPerRequest: null,
  }

  discoveryQueue = new Queue('job-discovery', { connection })

  discoveryQueue.on('error', (err) => {
    logger.warn(`Discovery Queue Redis connection warning: ${err.message}`)
  })
} catch (err) {
  logger.warn(`Redis queue not available: ${err.message}`)
}

async function addDiscoveryJob(userId, data = {}) {
  if (!discoveryQueue) {
    logger.info(`Redis queue not active. Discovery job for user ${userId} skipped or handled synchronously.`)
    return null
  }
  return discoveryQueue.add('discover-jobs', { userId, ...data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  })
}

module.exports = { discoveryQueue, addDiscoveryJob }
