const resumeService = require('../services/resumeService')
const jobService    = require('../services/jobService')

const resumeController = {
  async uploadResume(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No resume file uploaded' })
      }

      const resume = await resumeService.processResumeUpload({
        userId: req.user._id,
        file: req.file,
      })

      // Run background matching discovery asynchronously for user
      jobService.runDiscoveryForUser(req.user).catch(() => {})

      return res.status(201).json({
        success: true,
        message: 'Resume uploaded and processed successfully',
        resume,
        resumes: [resume],
      })
    } catch (err) {
      next(err)
    }
  },

  async getResume(req, res, next) {
    try {
      const resume = await resumeService.getPrimaryResume(req.user._id)
      return res.json({ success: true, resume, resumes: resume ? [resume] : [] })
    } catch (err) {
      next(err)
    }
  },

  async updateProfile(req, res, next) {
    try {
      const resume = await resumeService.updateParsedProfile(req.user._id, req.params.id, req.body)
      return res.json({ success: true, resume })
    } catch (err) {
      next(err)
    }
  },

  async deleteResume(req, res, next) {
    try {
      await resumeService.deleteResume(req.user._id, req.params.id)
      return res.json({ success: true, message: 'Resume deleted successfully' })
    } catch (err) {
      next(err)
    }
  },

  async analyzeResume(req, res, next) {
    try {
      const resume = await resumeService.getPrimaryResume(req.user._id)
      if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
      return res.json({ success: true, message: 'Analysis complete', resume, resumes: [resume] })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = resumeController
