const mongoose     = require('mongoose')
const Job            = require('../models/Job')
const Match          = require('../models/Match')
const Resume         = require('../models/Resume')
const User           = require('../models/User')
const aiClient       = require('../clients/aiClient')
const notificationService = require('./notificationService')
const logger         = require('../utils/logger')

function escapeRegExp(string) {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isHighSalaryJob(job) {
  if (!job || !job.salary) return false
  const sal = job.salary
  const disp = String(sal.display || '')

  // Period-based numeric checks
  if (sal.min) {
    if (sal.period === 'hourly' && sal.min >= 15) return true
    if (sal.period === 'monthly' && sal.min >= 10000) return true
    if (sal.period === 'yearly' && (sal.min >= 300000 || (sal.currency === 'USD' && sal.min >= 40000))) return true
    if (!sal.period && sal.min >= 10000) return true
  }
  if (sal.max) {
    if (sal.period === 'hourly' && sal.max >= 20) return true
    if (sal.period === 'monthly' && sal.max >= 10000) return true
    if (sal.period === 'yearly' && (sal.max >= 300000 || (sal.currency === 'USD' && sal.max >= 40000))) return true
    if (!sal.period && sal.max >= 10000) return true
  }

  // Text-based checks on display string (e.g. ₹100,000, 10k+, $50/hr, 6 LPA)
  if (/(?:₹|rs\.?|inr)\s*(?:[1-9]\d{4,}|\d{2,}\s*k)/i.test(disp)) return true
  if (/\b(?:1[0-9]|[2-9][0-9])\s*k\s*\/?\s*(?:mo|month|pm)?/i.test(disp)) return true
  if (/\b[3-9]\s*(?:lpa|lakhs?|lac)\b/i.test(disp)) return true
  if (/\$\s*(?:[3-9]\d{4,}|\d{2,}\s*k|[2-9]\d\/hr)/i.test(disp)) return true
  if (/100,000|125,000|[1-9]\d{4,}/.test(disp)) return true

  return false
}

function shouldNotifyJob(job, matchScore) {
  // 1. Must satisfy high match score (>= 80%)
  if (!matchScore || matchScore < 80) return false

  // 2. Filter out non-technical roles that software engineers shouldn't get notified for
  const title = String(job?.title || '').toLowerCase()
  const excludedRoles = [
    'recruiter', 'sourcer', 'talent acquisition', 'telecaller', 'telecall',
    'bpo', 'call center', 'data entry', 'telemarketer', 'sales', 'business development',
    'social media', 'content writer', 'copywriter', 'seo intern', 'customer support',
    'operations associate'
  ]
  if (excludedRoles.some(role => title.includes(role))) {
    return false
  }

  // 3. Must be high salary / stipend (>= ₹10,000/mo or equivalent)
  if (!isHighSalaryJob(job)) {
    return false
  }

  return true
}

const SAMPLE_JOBS = [
  {
    title: 'Junior Full Stack Developer',
    company: 'CloudScale Technologies',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&crop=faces',
    location: 'Remote',
    workMode: 'Remote',
    jobType: 'Full-time',
    experienceLevel: 'Entry-level',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB', 'Git'],
    salary: { min: 70000, max: 90000, currency: 'USD', period: 'yearly' },
    description: 'We are looking for an ambitious Junior Full Stack Developer to build modern cloud management dashboards and microservice APIs. You will collaborate closely with senior engineers in an agile environment.',
    requirements: [
      'Proficiency in JavaScript/TypeScript and React',
      'Hands-on experience with Node.js and Express or NestJS',
      'Understanding of REST APIs and MongoDB',
      'Familiarity with Git and modern CI/CD workflows',
    ],
    responsibilities: [
      'Implement responsive UI components in React and Tailwind CSS',
      'Write scalable REST endpoints in Node.js',
      'Participate in code reviews and sprint planning',
      'Write clean, unit-tested code',
    ],
    applyUrl: 'https://example.com/apply/cloudscale-1',
    source: 'Direct',
    tags: ['React', 'Node.js', 'Remote', 'Full-time'],
  },
  {
    title: 'AI / Machine Learning Engineer (Intern / Co-op)',
    company: 'Synthetix AI Lab',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&h=100&fit=crop&crop=faces',
    location: 'San Francisco, CA (Hybrid)',
    workMode: 'Hybrid',
    jobType: 'Internship',
    experienceLevel: 'Fresher',
    skills: ['Python', 'PyTorch', 'FastAPI', 'LangChain', 'Docker', 'NLP'],
    salary: { min: 45, max: 60, currency: 'USD', period: 'hourly' },
    description: 'Join our research & deployment team building agentic workflows and retrieval-augmented generation (RAG) pipelines. Perfect for students and recent grads passionate about state-of-the-art AI.',
    requirements: [
      'Strong Python programming skills and CS fundamentals',
      'Experience with PyTorch, Hugging Face, or LangChain',
      'Familiarity with vector databases and embedding models',
      'Eagerness to experiment and benchmark LLM architectures',
    ],
    responsibilities: [
      'Prototype multi-agent workflows using LangGraph',
      'Evaluate model hallucination and retrieval precision',
      'Integrate models into production FastAPI endpoints',
    ],
    applyUrl: 'https://example.com/apply/synthetix-ai',
    source: 'Direct',
    tags: ['AI', 'Python', 'PyTorch', 'Internship'],
  },
  {
    title: 'Frontend React Engineer',
    company: 'Veloce Dynamics',
    companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop&crop=faces',
    location: 'New York, NY',
    workMode: 'Hybrid',
    jobType: 'Full-time',
    experienceLevel: 'Entry-level',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'Jest'],
    salary: { min: 80000, max: 105000, currency: 'USD', period: 'yearly' },
    description: 'Veloce is redefining real-time collaboration. We need a frontend engineer who cares deeply about design details, web performance, 60fps animations, and delightful user interactions.',
    requirements: [
      'Strong proficiency in React 18, Next.js, and TypeScript',
      'Deep appreciation for UI/UX, micro-animations, and Tailwind CSS',
      'Knowledge of client state management and React Query',
    ],
    responsibilities: [
      'Build sleek user interfaces and real-time collaboration widgets',
      'Optimize bundle size and Core Web Vitals',
      'Collaborate with product designers to prototype novel UI patterns',
    ],
    applyUrl: 'https://example.com/apply/veloce-react',
    source: 'Direct',
    tags: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
  },
  {
    title: 'Backend API Engineer (Node.js / Go)',
    company: 'HyperRoute Logistics',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop&crop=faces',
    location: 'Remote',
    workMode: 'Remote',
    jobType: 'Full-time',
    experienceLevel: 'Mid-level',
    skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'Microservices'],
    salary: { min: 95000, max: 130000, currency: 'USD', period: 'yearly' },
    description: 'We process millions of supply-chain events daily. We are expanding our backend infrastructure team to build high-throughput telemetry pipelines and event-driven services.',
    requirements: [
      '2+ years building production backend services in Node.js or Go',
      'Strong relational DB design with PostgreSQL',
      'Experience with caching and queuing via Redis / BullMQ / Kafka',
    ],
    responsibilities: [
      'Architect resilient API endpoints and background workers',
      'Profile database queries and resolve performance bottlenecks',
      'Maintain automated integration test suites and CI pipelines',
    ],
    applyUrl: 'https://example.com/apply/hyperroute-backend',
    source: 'Direct',
    tags: ['Node.js', 'PostgreSQL', 'Redis', 'Go', 'Remote'],
  },
  {
    title: 'DevOps & Platform Engineering Intern',
    company: 'Nexus Infra Systems',
    companyLogo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&h=100&fit=crop&crop=faces',
    location: 'Austin, TX (Remote Optional)',
    workMode: 'Remote',
    jobType: 'Internship',
    experienceLevel: 'Fresher',
    skills: ['Linux', 'Docker', 'Kubernetes', 'AWS', 'GitHub Actions', 'Python'],
    salary: { min: 40, max: 55, currency: 'USD', period: 'hourly' },
    description: 'Learn modern platform engineering hands-on. Assist our DevOps team in automating Kubernetes deployments, enhancing monitoring dashboards, and securing cloud infrastructure.',
    requirements: [
      'Linux command line proficiency and scripting knowledge',
      'Basic understanding of containers with Docker',
      'Interest in cloud providers (AWS, GCP, or Azure)',
    ],
    responsibilities: [
      'Write and improve GitHub Actions deployment workflows',
      'Containerize microservices and configure Helm charts',
      'Set up alerting with Prometheus and Grafana',
    ],
    applyUrl: 'https://example.com/apply/nexus-devops',
    source: 'Direct',
    tags: ['DevOps', 'Docker', 'AWS', 'Kubernetes', 'Remote'],
  },
  {
    title: 'Associate Software Engineer - Frontend',
    company: 'Apex HealthTech',
    companyLogo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&h=100&fit=crop&crop=faces',
    location: 'Boston, MA (Hybrid)',
    workMode: 'Hybrid',
    jobType: 'Full-time',
    experienceLevel: 'Fresher',
    skills: ['JavaScript', 'React', 'CSS3', 'REST API', 'Git'],
    salary: { min: 72000, max: 88000, currency: 'USD', period: 'yearly' },
    description: 'Help build compassionate, accessible patient portals and healthcare provider dashboards used by over 500,000 clinicians nationwide.',
    requirements: [
      'Bachelor’s in CS or equivalent bootcamp experience',
      'Solid JavaScript fundamentals and React component architecture',
      'Passion for accessibility (a11y) and user-centric design',
    ],
    responsibilities: [
      'Develop HIPAA-compliant patient communication web tools',
      'Collaborate with clinical specialists on workflow design',
      'Write unit tests using React Testing Library',
    ],
    applyUrl: 'https://example.com/apply/apex-healthtech',
    source: 'Direct',
    tags: ['React', 'Healthcare', 'Hybrid', 'Fresher'],
  },
]

function sanitizeJobRecord(job) {
  if (!job) return job
  let company = job.company || 'Company'
  if (company.includes('class=') || company.includes('company-name') || company.includes('>')) {
    company = company
      .replace(/class\s*=\s*["'][^"']*["']\s*>?/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[>\s\n\r]+/g, ' ')
      .trim()
  }

  let description = job.description || ''
  if (description.includes('class=') || description.includes('company-name') || description.includes('>')) {
    description = description
      .replace(/class\s*=\s*["'][^"']*["']\s*>?/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  // Format short targeted synthetic descriptions into a clean, complete structure
  if (description.startsWith('Targeted opportunity for') || description.startsWith('Live internship opportunity for')) {
    const role = job.title || 'Software Developer'
    const cleanComp = company || 'Organization'
    const loc = job.location || 'India'
    const mode = job.workMode || 'Remote'
    const type = job.jobType || 'Internship'
    const stipend = job.salary?.display || 'Competitive / As per industry standards'
    const skillsList = job.skills && job.skills.length > 0 ? job.skills.slice(0, 5).join(', ') : 'Software Development, Problem Solving'

    description = `${cleanComp} is offering a ${type.toLowerCase()} opportunity for the role of ${role}.\n\n` +
      `Overview:\n` +
      `• Position: ${role}\n` +
      `• Organization: ${cleanComp}\n` +
      `• Location: ${loc} (${mode})\n` +
      `• Stipend / Compensation: ${stipend}\n` +
      `• Core Skills: ${skillsList}\n\n` +
      `About the Opportunity:\n` +
      `You will work with active engineering teams at ${cleanComp} on production features, gaining practical experience in ${skillsList} in an agile development environment.`
  }

  return {
    ...job,
    company: company || 'Company',
    description: description || 'No description available.',
  }
}

function enrichJobWithMatch(job, match, resumeProfile) {
  const cleanJob = sanitizeJobRecord(job)
  let m = match
  if (!m && resumeProfile) {
    m = aiClient.localMatchJob ? aiClient.localMatchJob(resumeProfile, cleanJob) : null
  }

  if (!m) return cleanJob

  return {
    ...cleanJob,
    matchScore: m.matchScore,
    categoryScores: m.categoryScores,
    matchBreakdown: m.categoryScores,
    matchingSkills: m.matchingSkills || [],
    missingSkills: m.missingSkills || [],
    matchDetails: {
      matchingSkills: m.matchingSkills || [],
      missingSkills: m.missingSkills || [],
      explanation: m.copilotPitch || (m.strengths?.length ? m.strengths.join('. ') : ''),
    },
    matchHighlights: (m.strengths && m.strengths.length > 0)
      ? m.strengths
      : ((m.matchingSkills && m.matchingSkills.length > 0)
          ? m.matchingSkills.map(s => `${s} matched`)
          : []),
    copilotPitch: m.copilotPitch,
  }
}

const jobService = {
  async seedDefaultJobs() {
    try {
      const realJobFetcher = require('./realJobFetcher')
      const count = await Job.countDocuments()
      if (count === 0) {
        await realJobFetcher.syncAllRealJobs({ maxJobs: 50 }).catch(() => {})
        logger.info('Synced initial live jobs from external sources.')
      }
      // Proactively sync live external jobs in the background
      realJobFetcher.syncAllRealJobs({ maxJobs: 50 }).catch(err => {
        logger.warn(`Initial real job sync notice: ${err.message}`)
      })

      // Clean up any legacy dirty jobs with raw HTML in company/description
      Job.find({ $or: [{ company: /company-name/i }, { description: /company-name/i }] }).lean().then(dirtyJobs => {
        if (dirtyJobs && dirtyJobs.length > 0) {
          for (const dj of dirtyJobs) {
            const clean = sanitizeJobRecord(dj)
            Job.updateOne({ _id: dj._id }, { $set: { company: clean.company, description: clean.description } }).catch(() => {})
          }
          logger.info(`Cleaned ${dirtyJobs.length} legacy job postings with HTML artifacts.`)
        }
      }).catch(() => {})
    } catch (err) {
      logger.error(`Error seeding jobs: ${err.message}`)
    }
  },

  startPeriodicJobSync(intervalMinutes = 30) {
    if (this._syncInterval) clearInterval(this._syncInterval)
    const intervalMs = intervalMinutes * 60 * 1000
    logger.info(`⏰ Automated background job sync initialized: running every ${intervalMinutes} minutes.`)

    this._syncInterval = setInterval(async () => {
      try {
        logger.info('🔄 [Auto-Fetch] Running scheduled background sync for new jobs & internships...')
        const realJobFetcher = require('./realJobFetcher')
        await realJobFetcher.syncAllRealJobs({ maxJobs: 50 })

        // Auto-run discovery for registered users with active resumes
        const primaryResumes = await Resume.find({ isPrimary: true }).distinct('userId')
        if (primaryResumes.length > 0) {
          const users = await User.find({ _id: { $in: primaryResumes } }).limit(25)
          for (const u of users) {
            await this.runDiscoveryForUser(u).catch(() => {})
          }
        }
      } catch (err) {
        logger.warn(`[Auto-Fetch] Scheduled sync notice: ${err.message}`)
      }
    }, intervalMs)
  },

  async syncRealJobs(options = {}, user = null) {
    const realJobFetcher = require('./realJobFetcher')
    if (options.location && /outside[\s_-]*india|international|foreign|global/i.test(options.location)) {
      await realJobFetcher.fetchOutsideIndiaJobs(options.limit || 35).catch(() => {})
    }
    if (user) {
      const resume = await Resume.findOne({ userId: user._id, isPrimary: true })
      const skills = (resume?.parsedProfile?.skills || user.preferences?.targetRoles || [])
      const locations = options.location ? [options.location] : (user.preferences?.locations || [])
      if (skills.length > 0 || locations.length > 0) {
        await realJobFetcher.fetchTargetedInternshipsAndJobs({
          skills,
          locations,
          limit: 30,
        }).catch(() => {})
      }
    }
    return await realJobFetcher.syncAllRealJobs(options)
  },

  async listJobs({
    q,
    location,
    workMode,
    jobType,
    experienceLevel,
    skills,
    minSalary,
    page = 1,
    limit = 12,
    sort = 'newest',
    userId,
  } = {}) {
    if (mongoose.connection.readyState !== 1) {
      let filtered = SAMPLE_JOBS.map((j, idx) => ({ ...j, _id: `sample-${idx + 1}` }))
      if (q) {
        const ql = q.toLowerCase()
        filtered = filtered.filter(j => j.title.toLowerCase().includes(ql) || j.company.toLowerCase().includes(ql))
      }
      return {
        jobs: filtered.slice(0, Number(limit)),
        total: filtered.length,
        page: Number(page),
        totalPages: 1,
      }
    }

    const filter = { isActive: true }

    if (q) {
      filter.$or = [
        { title: { $regex: escapeRegExp(q), $options: 'i' } },
        { company: { $regex: escapeRegExp(q), $options: 'i' } },
        { skills: { $in: [new RegExp(escapeRegExp(q), 'i')] } },
      ]
    }

    if (location && String(location).trim().toLowerCase() !== 'all') {
      const locStr = String(location).trim()
      if (/outside[\s_-]*india|international|foreign/i.test(locStr)) {
        const intlCondition = {
          $or: [
            { isInternational: true },
            { tags: { $in: [/outside india/i, /international/i] } },
            { location: { $regex: /outside india|remote worldwide|united states|usa|dubai|singapore|london|germany|canada|berlin|uk|europe|australia|international/i } },
          ],
        }
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, intlCondition]
          delete filter.$or
        } else {
          filter.$or = intlCondition.$or
        }
      } else {
        filter.location = { $regex: locStr, $options: 'i' }
      }
    }

    if (workMode && workMode !== 'all') {
      filter.workMode = workMode
    }

    if (jobType && jobType !== 'all') {
      filter.jobType = jobType
    }

    if (experienceLevel && experienceLevel !== 'all') {
      filter.experienceLevel = experienceLevel
    }

    if (minSalary) {
      filter['salary.min'] = { $gte: Number(minSalary) }
    }

    if (skills) {
      const skillList = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())
      if (skillList.length > 0) {
        filter.skills = { $in: skillList.map(s => new RegExp(escapeRegExp(s), 'i')) }
      }
    }

    // Check if authenticated user has a parsed resume profile
    let resume = null
    if (userId) {
      resume = await Resume.findOne({ userId }).sort({ isPrimary: -1, updatedAt: -1 }).lean()
    }
    const resumeProfile = resume?.parsedProfile || null

    const sortLower = String(sort || '').toLowerCase()
    const isMatchSort = sortLower === 'relevance' || sortLower === 'match score' || sortLower === 'match_score'

    // If sorting by match score/relevance and user has a resume, enrich & rank by match score
    if (isMatchSort && resumeProfile) {
      const allJobs = await Job.find(filter).lean()
      const jobIds = allJobs.map(j => j._id)
      const existingMatches = await Match.find({ userId, jobId: { $in: jobIds } }).lean()
      const matchMap = new Map()
      existingMatches.forEach(m => matchMap.set(String(m.jobId), m))

      const enriched = allJobs.map(job => {
        const match = matchMap.get(String(job._id))
        return enrichJobWithMatch(job, match, resumeProfile)
      })

      enriched.sort((a, b) => {
        const diff = (b.matchScore || 0) - (a.matchScore || 0)
        if (diff !== 0) return diff
        return new Date(b.postedAt || 0) - new Date(a.postedAt || 0)
      })

      const skip = (Number(page) - 1) * Number(limit)
      const paginated = enriched.slice(skip, skip + Number(limit))

      // Automatically trigger instant notifications for top jobs that suit skills & have high salary
      for (const pj of paginated.slice(0, 6)) {
        if (shouldNotifyJob(pj, pj.matchScore)) {
          this.notifyHighMatchIfNew(userId, pj, pj.matchScore).catch(() => {})
        }
      }

      return {
        jobs: paginated,
        total: enriched.length,
        page: Number(page),
        pages: Math.ceil(enriched.length / Number(limit)) || 1,
        totalPages: Math.ceil(enriched.length / Number(limit)) || 1,
      }
    }

    let sortOptions = { postedAt: -1 }
    if (sortLower === 'oldest') sortOptions = { postedAt: 1 }
    if (sortLower === 'salary') sortOptions = { 'salary.max': -1 }

    const skip = (Number(page) - 1) * Number(limit)

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Job.countDocuments(filter),
    ])

    // If user is authenticated and has resume, enrich the paginated jobs with match scores
    let finalJobs = jobs
    if (userId && resumeProfile) {
      const jobIds = jobs.map(j => j._id)
      const existingMatches = await Match.find({ userId, jobId: { $in: jobIds } }).lean()
      const matchMap = new Map()
      existingMatches.forEach(m => matchMap.set(String(m.jobId), m))
      finalJobs = jobs.map(job => {
        const match = matchMap.get(String(job._id))
        return enrichJobWithMatch(job, match, resumeProfile)
      })
    }

    return {
      jobs: finalJobs.map(sanitizeJobRecord),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    }
  },

  async getRecommendedJobs({ userId, limit = 6 } = {}) {
    let resume = null
    if (userId) {
      resume = await Resume.findOne({ userId }).sort({ isPrimary: -1, updatedAt: -1 }).lean()
    }
    const resumeProfile = resume?.parsedProfile || null
    const numLimit = Number(limit) || 6

    if (userId && resumeProfile) {
      const jobs = await Job.find({ isActive: true }).lean()
      const jobIds = jobs.map(j => j._id)
      const existingMatches = await Match.find({ userId, jobId: { $in: jobIds } }).lean()
      const matchMap = new Map()
      existingMatches.forEach(m => matchMap.set(String(m.jobId), m))

      const enriched = jobs.map(job => {
        const match = matchMap.get(String(job._id))
        return enrichJobWithMatch(job, match, resumeProfile)
      })

      enriched.sort((a, b) => {
        const diff = (b.matchScore || 0) - (a.matchScore || 0)
        if (diff !== 0) return diff
        return new Date(b.postedAt || 0) - new Date(a.postedAt || 0)
      })

      const topRecs = enriched.slice(0, numLimit)
      for (const rj of topRecs) {
        if (shouldNotifyJob(rj, rj.matchScore)) {
          this.notifyHighMatchIfNew(userId, rj, rj.matchScore).catch(() => {})
        }
      }

      return {
        jobs: topRecs,
        total: enriched.length,
      }
    }

    const jobs = await Job.find({ isActive: true })
      .sort({ postedAt: -1 })
      .limit(numLimit)
      .lean()

    return {
      jobs: jobs.map(sanitizeJobRecord),
      total: jobs.length,
    }
  },

  async getJobById(id, userId) {
    if (mongoose.connection.readyState !== 1) {
      const samples = SAMPLE_JOBS.map((j, idx) => ({ ...j, _id: `sample-${idx + 1}` }))
      const found = samples.find(j => j._id === id) || samples[0]
      return sanitizeJobRecord(found)
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }

    const job = await Job.findById(id).lean()
    if (!job) return null
    const sanitized = sanitizeJobRecord(job)

    if (userId) {
      const resume = await Resume.findOne({ userId }).sort({ isPrimary: -1, updatedAt: -1 }).lean()
      const match = await Match.findOne({ userId, jobId: id }).lean()
      return enrichJobWithMatch(sanitized, match, resume?.parsedProfile)
    }

    return sanitized
  },

  async computeMatchForUser(userId, jobId) {
    const [job, resume] = await Promise.all([
      Job.findById(jobId),
      Resume.findOne({ userId, isPrimary: true }),
    ])

    if (!job) throw new Error('Job not found')

    const resumeProfile = resume?.parsedProfile || { skills: ['JavaScript', 'React', 'Node.js'] }
    const matchData = await aiClient.matchJob(resumeProfile, job)

    // Upsert into Match collection
    const match = await Match.findOneAndUpdate(
      { userId, jobId },
      {
        userId,
        jobId,
        resumeId: resume?._id,
        matchScore: matchData.matchScore,
        categoryScores: matchData.categoryScores,
        matchingSkills: matchData.matchingSkills,
        missingSkills: matchData.missingSkills,
        strengths: matchData.strengths,
        weaknesses: matchData.weaknesses,
        copilotPitch: matchData.copilotPitch,
        computedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    return { match, job }
  },

  async notifyHighMatchIfNew(userId, job, matchScore) {
    try {
      if (!userId || !job) return
      if (!shouldNotifyJob(job, matchScore)) return
      const Notification = require('../models/Notification')
      const notificationService = require('./notificationService')

      const alreadyNotified = await Notification.exists({
        userId,
        'data.jobId': job._id,
      })
      if (alreadyNotified) return

      const stipendDisplay = job.salary?.display || (job.salary?.min ? `₹${job.salary.min.toLocaleString('en-IN')}/${job.salary.period || 'mo'}` : '')

      const title = stipendDisplay
        ? `💰 High Stipend (${stipendDisplay}): ${job.title} at ${job.company} (${matchScore}%)`
        : `🎯 High Match (${matchScore}%): ${job.title} at ${job.company}`

      const message = stipendDisplay
        ? `KhojAI found a high-paying opportunity (${stipendDisplay}) matching your skills: ${job.title} at ${job.company} (${job.location || 'Remote'}).`
        : `KhojAI found a high-match opportunity for your skills: ${job.title} at ${job.company} (${job.location || 'Remote'}).`

      await notificationService.sendNotification({
        userId,
        type: 'job_match',
        title,
        message,
        data: {
          jobId: job._id,
          matchScore,
          stipend: stipendDisplay,
          company: job.company,
        },
        channel: 'in_app',
      })
      logger.info(`Generated instant notification for high match & salary: ${job.title} at ${job.company} (${matchScore}%) for user ${userId}`)
    } catch (err) {
      logger.warn(`Could not send instant match notification: ${err.message}`)
    }
  },

  async getUserMatches(userId, { minScore = 0, limit = 20 } = {}) {
    return Match.find({ userId, matchScore: { $gte: Number(minScore) } })
      .populate('jobId')
      .sort({ matchScore: -1 })
      .limit(Number(limit))
      .lean()
  },

  async runDiscoveryForUser(user) {
    try {
      const resume = await Resume.findOne({ userId: user._id, isPrimary: true })
      const resumeProfile = resume?.parsedProfile || {
        skills: user.preferences?.targetRoles?.length ? user.preferences.targetRoles : ['JavaScript', 'React'],
      }

      // Proactively fetch live targeted postings for user's skills & locations
      try {
        const realJobFetcher = require('./realJobFetcher')
        await realJobFetcher.fetchTargetedInternshipsAndJobs({
          skills: resumeProfile.skills || [],
          locations: user.preferences?.locations || [],
          targetRoles: user.preferences?.targetRoles || [],
          limit: 30,
        })
      } catch (fetchErr) {
        logger.warn(`Targeted job fetch notice: ${fetchErr.message}`)
      }

      // Fetch candidates: all high-salary/stipend jobs, user-skill matching jobs, and recent postings
      const skillRegexes = (resumeProfile.skills || []).slice(0, 10).map(s => new RegExp(escapeRegExp(s), 'i'))
      const activeJobs = await Job.find({
        isActive: true,
        $or: [
          { 'salary.min': { $gte: 10000 } },
          { 'salary.display': { $regex: /month|stipend|\b\d+k\b|10,|15,|20,|25,|50,|100,/i } },
          { skills: { $in: skillRegexes } },
          { postedAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        ]
      }).sort({ postedAt: -1 }).limit(180).lean()

      const threshold = user.preferences?.minMatchScore || 60
      let newHighMatches = 0
      const Notification = require('../models/Notification')

      for (const job of activeJobs) {
        const matchData = await aiClient.matchJob(resumeProfile, job)

        const match = await Match.findOneAndUpdate(
          { userId: user._id, jobId: job._id },
          {
            userId: user._id,
            jobId: job._id,
            resumeId: resume?._id,
            matchScore: matchData.matchScore,
            categoryScores: matchData.categoryScores,
            matchingSkills: matchData.matchingSkills,
            missingSkills: matchData.missingSkills,
            strengths: matchData.strengths,
            weaknesses: matchData.weaknesses,
            copilotPitch: matchData.copilotPitch,
            computedAt: new Date(),
          },
          { upsert: true, returnDocument: 'after' }
        )

        if (shouldNotifyJob(job, match.matchScore) && user.preferences?.jobMatchAlerts !== false) {
          const alreadyNotified = await Notification.exists({
            userId: user._id,
            'data.jobId': job._id,
          })

          if (!alreadyNotified) {
            const stipendDisplay = job.salary?.display || (job.salary?.min ? `₹${job.salary.min.toLocaleString('en-IN')}/${job.salary.period || 'mo'}` : '')

            const notifTitle = stipendDisplay
              ? `💰 High Stipend (${stipendDisplay}): ${job.title} at ${job.company} (${match.matchScore}%)`
              : `🎯 High Match (${match.matchScore}%): ${job.title} at ${job.company}`

            const notifMessage = stipendDisplay
              ? `KhojAI found a high-paying opportunity (${stipendDisplay}) matching your skills: ${job.title} at ${job.company} (${job.location || 'Remote'}).`
              : `KhojAI found a high-match opportunity for your skills: ${job.title} at ${job.company} (${job.location || 'Remote'}).`

            await notificationService.sendNotification({
              userId: user._id,
              type: 'job_match',
              title: notifTitle,
              message: notifMessage,
              data: {
                jobId: job._id,
                matchScore: match.matchScore,
                stipend: stipendDisplay,
                company: job.company,
              },
              channel: user.preferences?.emailEnabled ? 'all' : 'in_app',
            })
            newHighMatches++
          }
        }
      }

      logger.info(`Discovery run for user ${user._id}: found ${newHighMatches} new high-match opportunities.`)
      return { totalEvaluated: activeJobs.length, newHighMatches }
    } catch (err) {
      logger.error(`Error running discovery for user ${user._id}: ${err.message}`)
      throw err
    }
  },
}

module.exports = jobService
