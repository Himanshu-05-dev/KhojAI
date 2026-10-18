const Roadmap   = require('../models/Roadmap')
const Resume    = require('../models/Resume')
const aiClient  = require('../clients/aiClient')

const roadmapController = {
  async getRoadmap(req, res, next) {
    try {
      let roadmap = await Roadmap.findOne({ userId: req.user._id })
      if (!roadmap) {
        // Auto-generate initial roadmap based on user preferences / resume
        const targetRole = req.user.preferences?.targetRoles?.[0] || 'Full Stack Engineer'
        const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true })
        const generated = await aiClient.generateRoadmap(resume?.parsedProfile || {}, targetRole)

        roadmap = await Roadmap.create({
          userId: req.user._id,
          targetRole: generated.targetRole,
          overallProgress: generated.overallProgress,
          skillGaps: generated.skillGaps,
          milestones: generated.milestones,
        })
      }

      return res.json({ success: true, roadmap })
    } catch (err) {
      next(err)
    }
  },

  async generateRoadmap(req, res, next) {
    try {
      const targetRole = req.body.targetRole || req.user.preferences?.targetRoles?.[0] || 'Full Stack Engineer'
      const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true })
      const generated = await aiClient.generateRoadmap(resume?.parsedProfile || {}, targetRole)

      const roadmap = await Roadmap.findOneAndUpdate(
        { userId: req.user._id },
        {
          userId: req.user._id,
          targetRole: generated.targetRole,
          overallProgress: generated.overallProgress,
          skillGaps: generated.skillGaps,
          milestones: generated.milestones,
          generatedAt: new Date(),
        },
        { upsert: true, new: true }
      )

      return res.json({ success: true, roadmap })
    } catch (err) {
      next(err)
    }
  },

  async updateMilestoneStatus(req, res, next) {
    try {
      const { milestoneId } = req.params
      const { status } = req.body

      const roadmap = await Roadmap.findOne({ userId: req.user._id })
      if (!roadmap) {
        return res.status(404).json({ success: false, message: 'Roadmap not found' })
      }

      const milestone = roadmap.milestones.find(m => m.id === milestoneId)
      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Milestone not found' })
      }

      milestone.status = status
      if (status === 'completed') {
        milestone.completedAt = new Date()
      } else {
        milestone.completedAt = null
      }

      // Recompute overall progress
      const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length
      roadmap.overallProgress = Math.round((completedCount / (roadmap.milestones.length || 1)) * 100)

      await roadmap.save()
      return res.json({ success: true, roadmap })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = roadmapController
