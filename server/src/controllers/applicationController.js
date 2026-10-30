const Application = require('../models/Application')
const Job         = require('../models/Job')

const applicationController = {
  async listApplications(req, res, next) {
    try {
      const { status, sort = 'recent' } = req.query
      const filter = { userId: req.user._id }
      if (status && status !== 'all' && status !== 'All') {
        filter.status = status
      }

      let sortOption = { appliedDate: -1 }
      if (sort === 'company') sortOption = { company: 1 }

      const applications = await Application.find(filter)
        .sort(sortOption)
        .populate('jobId')
        .lean()

      return res.json({
        success: true,
        applications,
        data: { applications },
      })
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
      return res.json({ success: true, application: app, data: app })
    } catch (err) {
      next(err)
    }
  },

  async createApplication(req, res, next) {
    try {
      let {
        jobId,
        company,
        role,
        location,
        jobUrl,
        applyUrl,
        status,
        deadline,
        notes,
        salaryOffered,
        appliedDate,
        appliedAt,
      } = req.body

      // If jobId is provided, lookup job to auto-fill company, role, location, and applyUrl
      if (jobId) {
        try {
          const job = await Job.findById(jobId).lean()
          if (job) {
            company  = company || job.company
            role     = role || job.title
            location = location || job.location || 'Remote'
            jobUrl   = jobUrl || applyUrl || job.applyUrl || ''
          }
        } catch (_) {}
      }

      // Check if application already exists for this user and jobId
      if (jobId) {
        const existing = await Application.findOne({ userId: req.user._id, jobId })
        if (existing) {
          if (status && status !== existing.status) {
            existing.status = status
            existing.timeline.push({
              status,
              changedAt: new Date(),
              note: `Status updated to ${status}`,
            })
            await existing.save()
          }
          return res.status(200).json({
            success: true,
            message: 'Job is already in your application tracker',
            application: existing,
            data: existing,
          })
        }
      }

      const finalCompany = (company || '').trim()
      const finalRole    = (role || '').trim()

      if (!finalCompany || !finalRole) {
        return res.status(400).json({
          success: false,
          message: 'Company and Role are required to track an application',
        })
      }

      const finalStatus = status || 'Applied'
      const app = await Application.create({
        userId: req.user._id,
        jobId: jobId || undefined,
        company: finalCompany,
        role: finalRole,
        location: location || 'Remote',
        jobUrl: jobUrl || applyUrl || '',
        status: finalStatus,
        appliedDate: appliedDate || appliedAt || new Date(),
        deadline: deadline || undefined,
        salaryOffered: salaryOffered || '',
        notes: notes || '',
        timeline: [{
          status: finalStatus,
          changedAt: new Date(),
          note: 'Initial application entry created',
        }],
      })

      return res.status(201).json({
        success: true,
        message: 'Application tracked successfully',
        application: app,
        data: app,
      })
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
      return res.json({ success: true, application: app, data: app })
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

  async parseEmailAndUpdate(req, res, next) {
    try {
      const { emailText, subject = '' } = req.body
      if (!emailText || !emailText.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide email or message text to analyze' })
      }

      const fullText = `${subject}\n${emailText}`.toLowerCase()

      // Fetch user's tracked applications
      const apps = await Application.find({ userId: req.user._id })

      // 1. Identify which application matches
      let matchedApp = null
      for (const app of apps) {
        const compLower = (app.company || '').toLowerCase().trim()
        if (compLower.length > 2 && fullText.includes(compLower)) {
          matchedApp = app
          break
        }
      }

      // If no direct company match in text, try matching by role
      if (!matchedApp && apps.length > 0) {
        for (const app of apps) {
          const roleLower = (app.role || '').toLowerCase().trim()
          if (roleLower.length > 3 && fullText.includes(roleLower)) {
            matchedApp = app
            break
          }
        }
      }

      // 2. Classify status using heuristic intent analysis
      let detectedStatus = 'Screening'
      let reason = 'Status updated automatically from recruiter communication'

      if (/(offer letter|pleased to offer|congratulations on the offer|welcome to the team|package of|job offer|formal offer)/i.test(fullText)) {
        detectedStatus = 'Offer'
        reason = 'Offer extended via communication'
      } else if (/(interview|schedule a call|video call|zoom link|google meet|technical discussion|panel interview|round \d|hiring manager chat)/i.test(fullText)) {
        detectedStatus = 'Interview'
        reason = 'Interview invited / scheduled'
      } else if (/(hackerrank|coderpad|assessment|coding challenge|test link|online assessment|take-home|technical test)/i.test(fullText)) {
        detectedStatus = 'Assessment'
        reason = 'Online assessment assigned'
      } else if (/(unfortunately|regret to inform|other candidates|not moving forward|position has been filled|pursue other|not selected)/i.test(fullText)) {
        detectedStatus = 'Rejected'
        reason = 'Decision update: Not moving forward'
      } else if (/(under review|reviewed your application|forwarded to hiring team|in review|reviewing your resume)/i.test(fullText)) {
        detectedStatus = 'Screening'
        reason = 'Resume under review by hiring team'
      }

      // Extract potential date (e.g., Nov 5, 2026-11-01, 10/15/2026)
      const dateMatch = fullText.match(/\b(?:on\s+)?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i)
      const foundDate = dateMatch ? dateMatch[1] : null

      if (!matchedApp) {
        // Try extracting company name from text if possible
        const compMatch = fullText.match(/(?:at|from|with)\s+([a-z0-9\s&]{3,25})(?:\s+team|\s+careers|\s+technologies|\s+recruiting)?/i)
        const extractedComp = compMatch ? compMatch[1].trim() : 'Recruiter Prospect'

        const formattedComp = extractedComp.charAt(0).toUpperCase() + extractedComp.slice(1)
        const newApp = await Application.create({
          userId: req.user._id,
          company: formattedComp,
          role: 'Applicant Role',
          status: detectedStatus,
          notes: `[Auto-created via Email Parser]: ${reason}\nExcerpt: "${subject || emailText.slice(0, 120)}..."`,
          timeline: [{
            status: detectedStatus,
            changedAt: new Date(),
            note: reason,
          }]
        })

        return res.json({
          success: true,
          message: `Detected ${detectedStatus} for ${newApp.company} and automatically created application!`,
          application: newApp,
          data: newApp,
          detected: { company: newApp.company, status: detectedStatus, reason, date: foundDate }
        })
      }

      // Update existing application
      const prevStatus = matchedApp.status
      matchedApp.status = detectedStatus
      matchedApp.timeline.push({
        status: detectedStatus,
        changedAt: new Date(),
        note: `${reason}${foundDate ? ` (Target date: ${foundDate})` : ''}`,
      })

      if (detectedStatus === 'Interview' && foundDate) {
        matchedApp.interviews = matchedApp.interviews || []
        matchedApp.interviews.push({
          stage: 'Upcoming Interview',
          notes: `Scheduled / mentioned: ${foundDate}`,
        })
      }

      const noteEntry = `[Auto-update]: ${reason}${foundDate ? ` on ${foundDate}` : ''} (${new Date().toLocaleDateString()})`
      matchedApp.notes = matchedApp.notes ? `${matchedApp.notes}\n${noteEntry}` : noteEntry

      await matchedApp.save()

      return res.json({
        success: true,
        message: `Automatically updated ${matchedApp.company} (${matchedApp.role}) to "${detectedStatus}"!`,
        application: matchedApp,
        data: matchedApp,
        detected: { company: matchedApp.company, prevStatus, newStatus: detectedStatus, reason, date: foundDate }
      })
    } catch (err) {
      next(err)
    }
  },

  async autoSyncApplications(req, res, next) {
    try {
      const apps = await Application.find({ userId: req.user._id })
      let updatedCount = 0
      const now = new Date()

      for (const app of apps) {
        const appDate = new Date(app.appliedDate || app.createdAt)
        const daysSinceApplied = Math.floor((now - appDate) / (1000 * 60 * 60 * 24))

        // Auto-progress stale 'Interested' or 'Applied' if > 3 days without updates
        if (app.status === 'Applied' && daysSinceApplied >= 3 && !app.notes?.includes('[Auto-Sync]')) {
          app.status = 'Screening'
          app.notes = (app.notes || '') + '\n[Auto-Sync]: Moved to Screening after recruiter initial intake window.'
          app.timeline.push({
            status: 'Screening',
            changedAt: now,
            note: 'Automatically progressed to Screening (recruiter intake timeframe reached)',
          })
          await app.save()
          updatedCount++
        }
      }

      const refreshedApps = await Application.find({ userId: req.user._id }).sort({ appliedDate: -1 })
      return res.json({
        success: true,
        message: updatedCount > 0 ? `Synced tracker: ${updatedCount} application(s) automatically progressed!` : 'All tracked applications are up-to-date with current pipelines.',
        updatedCount,
        applications: refreshedApps,
        data: { applications: refreshedApps },
      })
    } catch (err) {
      next(err)
    }
  },
}

module.exports = applicationController
