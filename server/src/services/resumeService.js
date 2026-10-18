const fs                  = require('fs')
const pdf                 = require('pdf-parse')
const Resume              = require('../models/Resume')
const aiClient            = require('../clients/aiClient')
const notificationService = require('./notificationService')
const logger              = require('../utils/logger')

const resumeService = {
  async processResumeUpload({ userId, file }) {
    let extractedText = ''

    try {
      if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(file.path)
        const pdfData = await pdf(dataBuffer)
        extractedText = pdfData.text || ''
      } else {
        extractedText = fs.readFileSync(file.path, 'utf8')
      }
    } catch (parseErr) {
      logger.warn(`PDF/Text parsing failed: ${parseErr.message}. Falling back to filename extraction.`)
      extractedText = `Resume for candidate from file ${file.originalname}`
    }

    // Set other resumes of this user as non-primary
    await Resume.updateMany({ userId }, { isPrimary: false })

    const resume = await Resume.create({
      userId,
      originalFilename: file.originalname,
      storageUrl: `/uploads/${file.filename}`,
      storageKey: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      extractedText,
      parsingStatus: 'processing',
    })

    try {
      const parsedProfile = await aiClient.parseResume(extractedText, file.originalname)

      resume.parsedProfile = parsedProfile
      resume.parsingStatus = 'completed'
      await resume.save()

      // Notify user
      await notificationService.sendNotification({
        userId,
        type: 'system',
        title: 'Resume Analyzed Successfully',
        message: `Extracted ${parsedProfile.skills?.length || 0} skills, ${parsedProfile.experienceYears || 0} years experience, and profile highlights.`,
        data: { resumeId: resume._id },
        channel: 'in_app',
      })

      return resume
    } catch (err) {
      logger.error(`Error in AI parsing: ${err.message}`)
      resume.parsingStatus = 'failed'
      resume.parsingError = err.message
      await resume.save()
      throw err
    }
  },

  async getPrimaryResume(userId) {
    return Resume.findOne({ userId, isPrimary: true }).lean()
  },

  async updateParsedProfile(userId, resumeId, updates) {
    const resume = await Resume.findOne({ _id: resumeId, userId })
    if (!resume) throw new Error('Resume not found')

    resume.parsedProfile = {
      ...resume.parsedProfile.toObject(),
      ...updates,
    }
    await resume.save()
    return resume
  },

  async deleteResume(userId, resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, userId })
    if (!resume) throw new Error('Resume not found')

    if (resume.storageKey) {
      const path = require('path')
      const config = require('../config')
      const fullPath = path.resolve(config.storageDir, resume.storageKey)
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath) } catch (_) {}
      }
    }

    await Resume.findByIdAndDelete(resumeId)

    // Promote latest if one exists
    const latest = await Resume.findOne({ userId }).sort({ createdAt: -1 })
    if (latest) {
      latest.isPrimary = true
      await latest.save()
    }

    return { success: true }
  },
}

module.exports = resumeService
