const Application = require('../models/Application')

const applicationController = {
  async listApplications(req, res, next) {
    try {
      const { status, sort = 'recent' } = req.query
      const filter = { userId: req.user._id }
      if (status && status !== 'all') {
        filter.status = status
      }

      let sortOption = { appliedDate: -1 }
      if (sort === 'company') sortOption = { company: 1 }

      const applications = await Application.find(filter)
        .sort(sortOption)
        .populate('jobId')
        .lean()

      return res.json({ success: true, applications })
    } catch (err) {
      next(err)
    }
  },

  async getApplicationById(req, res, next) {
    try {
      const app = await Application.findOne({ _id: req.params.id, userId: req.user._id }).populate('jobId')
      if (!app) {
        return res.status(404).json({ success: false, message: 'Application not found' })
      }
      return res.json({ success: true, application: app })
    } catch (err) {
      next(err)
    }
  },

  async createApplication(req, res, next) {
    try {
      const app = await Application.create({
        ...req.body,
        userId: req.user._id,
        timeline: [{
          status: req.body.status || 'Applied',
          changedAt: new Date(),
          note: 'Initial application entry created',
        }],
      })

      return res.status(201).json({ success: true, application: app })
    } catch (err) {
      next(err)
    }
  },

  async updateApplication(req, res, next) {
    try {
      const app = await Application.findOne({ _id: req.params.id, userId: req.user._id })
      if (!app) {
        return res.status(404).json({ success: false, message: 'Application not found' })
      }

      const prevStatus = app.status
      Object.assign(app, req.body)

      if (req.body.status && req.body.status !== prevStatus) {
        app.timeline.push({
          status: req.body.status,
          changedAt: new Date(),
          note: `Status updated to ${req.body.status}`,
        })
      }

      await app.save()
      return res.json({ success: true, application: app })
    } catch (err) {
      next(err)
    }
  },

  async deleteApplication(req, res, next) {
    try {
      const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
      if (!app) {
        return res.status(404).json({ success: false, message: 'Application not found' })
      }
      return res.json({ success: true, message: 'Application deleted successfully' })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = applicationController
