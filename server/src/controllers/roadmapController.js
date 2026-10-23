const Roadmap   = require('../models/Roadmap')
const Resume    = require('../models/Resume')
const aiClient  = require('../clients/aiClient')

function mapMilestonesToTasks(milestones = []) {
  return milestones.map((m) => {
    let taskType = 'skill'
    if (m.category === 'project') {
      taskType = 'project'
    } else if (m.category === 'practice' || m.title?.toLowerCase().includes('interview')) {
      taskType = 'interview'
    } else {
      taskType = 'skill'
    }

    const firstResource = m.resources && m.resources.length > 0 ? m.resources[0].url : null

    return {
      _id: m._id ? String(m._id) : (m.id || String(m._id)),
      id: m.id || String(m._id),
      title: m.title,
      description: m.description,
      type: taskType,
      category: m.category || 'project',
      estimatedTime: m.estimatedHours ? `${m.estimatedHours} hours` : '10 hours',
      completed: m.status === 'completed',
      status: m.status || 'not_started',
      resourceUrl: firstResource,
      resources: m.resources || [],
    }
  })
}

function formatRoadmapResponse(roadmapDoc) {
  if (!roadmapDoc) return null
  const roadmapObj = roadmapDoc.toObject ? roadmapDoc.toObject() : { ...roadmapDoc }

  const skillGaps = (roadmapObj.skillGaps || []).map(g => (typeof g === 'string' ? g : g.skill)).filter(Boolean)
  const tasks = mapMilestonesToTasks(roadmapObj.milestones || [])
  const doneTasks = tasks.filter(t => t.completed).length
  const overallProgress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : (roadmapObj.overallProgress || 0)

  return {
    ...roadmapObj,
    skillGaps,
    skillGapDetails: roadmapObj.skillGaps || [],
    tasks,
    overallProgress,
  }
}

const roadmapController = {
  async getRoadmap(req, res, next) {
    try {
      let roadmap = await Roadmap.findOne({ userId: req.user._id })
      if (!roadmap) {
        // Auto-generate initial roadmap based on user preferences / resume
        const targetRole = req.user.preferences?.targetRoles?.[0] || 'Full Stack Engineer'
        const resume = await Resume.findOne({ userId: req.user._id }).sort({ isPrimary: -1, updatedAt: -1 })
        const generated = await aiClient.generateRoadmap(resume?.parsedProfile || {}, targetRole)

        roadmap = await Roadmap.create({
          userId: req.user._id,
          targetRole: generated.targetRole,
          overallProgress: generated.overallProgress,
          skillGaps: generated.skillGaps,
          milestones: generated.milestones,
        })
      }

      return res.json({ success: true, roadmap: formatRoadmapResponse(roadmap) })
    } catch (err) {
      next(err)
    }
  },

  async generateRoadmap(req, res, next) {
    try {
      const targetRole = req.body.targetRole || req.user.preferences?.targetRoles?.[0] || 'Full Stack Engineer'
      const resume = await Resume.findOne({ userId: req.user._id }).sort({ isPrimary: -1, updatedAt: -1 })
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

      return res.json({ success: true, roadmap: formatRoadmapResponse(roadmap) })
    } catch (err) {
      next(err)
    }
  },

  async updateTask(req, res, next) {
    try {
      const { id } = req.params
      const { completed, status } = req.body

      const roadmap = await Roadmap.findOne({ userId: req.user._id })
      if (!roadmap) {
        return res.status(404).json({ success: false, message: 'Roadmap not found' })
      }

      const milestone = roadmap.milestones.find(
        m => String(m._id) === id || m.id === id
      )
      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Task/milestone not found' })
      }

      const isCompleted = completed !== undefined ? Boolean(completed) : status === 'completed'
      milestone.status = isCompleted ? 'completed' : 'not_started'
      milestone.completedAt = isCompleted ? new Date() : null

      const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length
      roadmap.overallProgress = Math.round((completedCount / (roadmap.milestones.length || 1)) * 100)

      await roadmap.save()
      return res.json({ success: true, roadmap: formatRoadmapResponse(roadmap) })
    } catch (err) {
      next(err)
    }
  },

  async updateMilestoneStatus(req, res, next) {
    try {
      const { milestoneId } = req.params
      const { status, completed } = req.body

      const roadmap = await Roadmap.findOne({ userId: req.user._id })
      if (!roadmap) {
        return res.status(404).json({ success: false, message: 'Roadmap not found' })
      }

      const milestone = roadmap.milestones.find(
        m => String(m._id) === milestoneId || m.id === milestoneId
      )
      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Milestone not found' })
      }

      const newStatus = status || (completed ? 'completed' : 'not_started')
      milestone.status = newStatus
      milestone.completedAt = newStatus === 'completed' ? new Date() : null

      // Recompute overall progress
      const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length
      roadmap.overallProgress = Math.round((completedCount / (roadmap.milestones.length || 1)) * 100)

      await roadmap.save()
      return res.json({ success: true, roadmap: formatRoadmapResponse(roadmap) })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = roadmapController
