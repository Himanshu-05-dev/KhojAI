const fs                  = require('fs')
const path                = require('path')
const Resume              = require('../models/Resume')
const aiClient            = require('../clients/aiClient')
const notificationService = require('./notificationService')
const logger              = require('../utils/logger')
const config              = require('../config')

async function extractTextFromPdf(buffer) {
  try {
    const pdfModule = require('pdf-parse')
    if (pdfModule && pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer })
      const data = await parser.getText()
      await parser.destroy()
      if (data && data.text) return data.text
    }
    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer)
      if (data && data.text) return data.text
    }
    if (pdfModule && pdfModule.default && typeof pdfModule.default === 'function') {
      const data = await pdfModule.default(buffer)
      if (data && data.text) return data.text
    }
  } catch (err) {
    logger.warn(`PDF parse error: ${err.message}`)
  }
  return ''
}

const resumeService = {
  async processResumeUpload({ userId, file }) {
    let extractedText = ''

    try {
      if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(file.path)
        extractedText = await extractTextFromPdf(dataBuffer)
      } else {
        extractedText = fs.readFileSync(file.path, 'utf8')
      }
    } catch (parseErr) {
      logger.warn(`PDF/Text parsing failed: ${parseErr.message}`)
    }

    if (!extractedText || extractedText.trim().length === 0) {
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
      isPrimary: true,
    })

    try {
      const parsedProfile = await aiClient.parseResume(extractedText, file.originalname)

      resume.parsedProfile = parsedProfile
      resume.parsingStatus = 'completed'
      await resume.save()

      // Auto-fill user profile and preferences from resume details
      await resumeService.syncUserProfile(userId, resume)

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

  async reAnalyzeResume(userId, resumeId) {
    let resume = null
    if (resumeId && resumeId !== 'current') {
      try {
        resume = await Resume.findOne({ _id: resumeId, userId })
      } catch (_) {}
    }
    if (!resume) {
      resume = await Resume.findOne({ userId, isPrimary: true })
    }
    if (!resume) {
      resume = await Resume.findOne({ userId }).sort({ createdAt: -1 })
    }
    if (!resume) throw new Error('Resume not found')

    let extractedText = resume.extractedText || ''
    // Try to re-read and re-parse file from disk if available
    if (resume.storageKey) {
      const possiblePaths = [
        path.resolve(config.storageDir, resume.storageKey),
        path.resolve(process.cwd(), 'uploads', resume.storageKey),
        path.resolve(process.cwd(), 'server', 'uploads', resume.storageKey),
        path.resolve(__dirname, '../../uploads', resume.storageKey),
      ]
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          try {
            const dataBuffer = fs.readFileSync(p)
            if (p.toLowerCase().endsWith('.pdf') || resume.originalFilename?.toLowerCase().endsWith('.pdf')) {
              const text = await extractTextFromPdf(dataBuffer)
              if (text && text.length > 50) {
                extractedText = text
                resume.extractedText = text
              }
            } else {
              extractedText = fs.readFileSync(p, 'utf8')
              resume.extractedText = extractedText
            }
          } catch (e) {
            logger.warn(`Failed reading file for re-analysis: ${e.message}`)
          }
          break
        }
      }
    }

    const parsedProfile = await aiClient.parseResume(extractedText || resume.originalFilename, resume.originalFilename)

    // Preserve any existing manually added skills while adding all newly extracted skills
    const existingSkills = resume.parsedProfile?.skills || []
    const parsedSkills = parsedProfile.skills || []
    const combinedSkills = [...parsedSkills]
    const seen = new Set(parsedSkills.map(s => s.toLowerCase()))
    for (const s of existingSkills) {
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase())
        combinedSkills.push(s)
      }
    }
    parsedProfile.skills = combinedSkills

    resume.parsedProfile = parsedProfile
    resume.parsingStatus = 'completed'
    await resume.save()
    return resume
  },

  async getPrimaryResume(userId) {
    let resume = await Resume.findOne({ userId, isPrimary: true }).lean()
    if (!resume) {
      resume = await Resume.findOne({ userId }).sort({ createdAt: -1 }).lean()
    }
    return resume
  },

  async updateParsedProfile(userId, resumeId, updates) {
    let resume = null
    if (resumeId && resumeId !== 'profile' && resumeId !== 'current') {
      try {
        resume = await Resume.findOne({ _id: resumeId, userId })
      } catch (_) {}
    }
    if (!resume) {
      resume = await Resume.findOne({ userId, isPrimary: true })
    }
    if (!resume) {
      resume = await Resume.findOne({ userId }).sort({ createdAt: -1 })
    }
    if (!resume) {
      resume = new Resume({
        userId,
        originalFilename: 'Profile_Resume.pdf',
        parsingStatus: 'completed',
        isPrimary: true,
        parsedProfile: {},
      })
    }

    const currentData = resume.parsedProfile && typeof resume.parsedProfile.toObject === 'function'
      ? resume.parsedProfile.toObject()
      : (resume.parsedProfile || {})

    resume.parsedProfile = {
      ...currentData,
      ...updates,
    }
    resume.markModified('parsedProfile')
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

  async syncUserProfile(userId, resume) {
    try {
      const User = require('../models/User')
      const user = await User.findById(userId)
      if (!user) return false
      return await resumeService.applyResumeToUser(user, resume)
    } catch (err) {
      logger.warn(`Failed to sync user profile from resume: ${err.message}`)
      return false
    }
  },

  async applyResumeToUser(user, resume) {
    if (!user || !resume) return false
    const p = resume.parsedProfile && typeof resume.parsedProfile.toObject === 'function'
      ? resume.parsedProfile.toObject()
      : (resume.parsedProfile || {})
    const text = resume.extractedText || ''
    let modified = false

    // 1. Phone: from parsedProfile or extractedText
    if (!user.phone || user.phone.trim() === '') {
      const phone = p.phone || (text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] ?? '')
      if (phone && phone.trim()) {
        user.phone = phone.trim()
        modified = true
      }
    }

    // 2. Name: from parsedProfile
    if (p.name && p.name.trim() && p.name !== 'Candidate' && (!user.name || user.name === 'Candidate' || user.name === 'User' || user.name === user.email.split('@')[0])) {
      user.name = p.name.trim()
      modified = true
    }

    // 3. Bio / Summary: from summary
    if (!user.bio || user.bio.trim() === '') {
      const bio = p.summary || ''
      if (bio && bio.trim()) {
        user.bio = bio.slice(0, 500).trim()
        modified = true
      }
    }

    // 4. LinkedIn URL
    if (!user.linkedinUrl || user.linkedinUrl.trim() === '') {
      let li = p.linkedinUrl || ''
      if (!li) {
        const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\.\/]+/i)
        if (match) li = match[0]
      }
      if (li) {
        if (!li.startsWith('http')) li = `https://${li}`
        user.linkedinUrl = li.replace(/\/+$/, '')
        modified = true
      }
    }

    // 5. GitHub URL
    if (!user.githubUrl || user.githubUrl.trim() === '') {
      let gh = p.githubUrl || ''
      if (!gh) {
        const match = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-\.\/]+/i)
        if (match) gh = match[0]
      }
      if (gh) {
        if (!gh.startsWith('http')) gh = `https://${gh}`
        user.githubUrl = gh.replace(/\/+$/, '')
        modified = true
      }
    }

    // 6. Portfolio URL
    if (!user.portfolioUrl || user.portfolioUrl.trim() === '') {
      let port = p.portfolioUrl || ''
      if (!port) {
        const match = text.match(/(?:https?:\/\/)?(?:www\.)?(?:leetcode\.com\/(?:u\/)?[a-zA-Z0-9_\-]+|[a-zA-Z0-9_-]+\.(?:dev|me|io|tech|app)(?:\/[^\s|]*)?)/i)
        if (match) port = match[0]
      }
      if (port) {
        if (!port.startsWith('http')) port = `https://${port}`
        user.portfolioUrl = port.replace(/\/+$/, '')
        modified = true
      }
    }

    // 7. Current Status: infer from education or experience
    const currentYear = new Date().getFullYear()
    const isCurrentStudent = p.education?.some(e => {
      const end = parseInt(e.endYear, 10)
      return end && end >= currentYear
    })
    if (isCurrentStudent) {
      if (user.currentStatus !== 'Student') {
        user.currentStatus = 'Student'
        modified = true
      }
    } else if (p.experienceYears === 0) {
      if (user.currentStatus !== 'Fresher' && user.currentStatus !== 'Student') {
        user.currentStatus = 'Fresher'
        modified = true
      }
    } else if (p.experienceYears > 0) {
      if (user.currentStatus !== 'Working Professional') {
        user.currentStatus = 'Working Professional'
        modified = true
      }
    }

    // 8. Location in Preferences
    if (!user.preferences) user.preferences = {}
    let candidateLocation = p.location || ''
    if (!candidateLocation) {
      const lines = text.split(/\r?\n/)
      for (const line of lines.slice(0, 5)) {
        const parts = line.split(/[|•·;]/)
        for (const part of parts) {
          const trimmed = part.trim()
          if (
            trimmed &&
            trimmed.length < 50 &&
            trimmed.includes(',') &&
            !trimmed.includes('@') &&
            !trimmed.includes('linkedin') &&
            !trimmed.includes('github') &&
            !trimmed.includes('leetcode') &&
            !trimmed.match(/^\+?\d/) &&
            !trimmed.match(/^https?:\/\//i)
          ) {
            candidateLocation = trimmed
            break
          }
        }
        if (candidateLocation) break
      }
    }

    if (candidateLocation) {
      const primaryCity = candidateLocation.split(',')[0].trim()
      const locs = user.preferences.locations || []
      if (primaryCity && !locs.some(l => l.toLowerCase() === primaryCity.toLowerCase())) {
        user.preferences.locations = [...locs, primaryCity]
        modified = true
      }
    }

    // 9. Target Roles from skills if empty
    if (!user.preferences.targetRoles || user.preferences.targetRoles.length === 0) {
      const inferred = []
      const skillStr = (p.skills || []).join(' ').toLowerCase()
      if (skillStr.includes('ai') || skillStr.includes('machine learning') || skillStr.includes('python')) {
        inferred.push('AI/ML Engineer')
      }
      if (skillStr.includes('react') || skillStr.includes('javascript') || skillStr.includes('node')) {
        inferred.push('Full Stack Developer')
      }
      if (skillStr.includes('backend') || skillStr.includes('api') || skillStr.includes('fastapi') || skillStr.includes('express')) {
        inferred.push('Backend Engineer')
      }
      if (inferred.length > 0) {
        user.preferences.targetRoles = inferred
        modified = true
      }
    }

    if (modified) {
      await user.save()
    }
    return modified
  },
}

module.exports = resumeService
