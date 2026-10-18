const jobService = require('../services/jobService')

const jobController = {
  async listJobs(req, res, next) {
    try {
      const result = await jobService.listJobs(req.query)
      return res.json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  },

  async getJobById(req, res, next) {
    try {
      const job = await jobService.getJobById(req.params.id)
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' })
      }
      return res.json({ success: true, job })
    } catch (err) {
      next(err)
    }
  },

  async getMatches(req, res, next) {
    try {
      const matches = await jobService.getUserMatches(req.user._id, req.query)
      return res.json({ success: true, matches })
    } catch (err) {
      next(err)
    }
  },

  async computeMatch(req, res, next) {
    try {
      const result = await jobService.computeMatchForUser(req.user._id, req.params.id)
      return res.json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  },

  async triggerDiscovery(req, res, next) {
    try {
      const result = await jobService.runDiscoveryForUser(req.user)
      return res.json({ success: true, message: 'Discovery scan complete', ...result })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = jobController
