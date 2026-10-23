const mongoose     = require('mongoose')
const Job            = require('../models/Job')
const Match          = require('../models/Match')
const Resume         = require('../models/Resume')
const aiClient       = require('../clients/aiClient')
const notificationService = require('./notificationService')
const logger         = require('../utils/logger')

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

function enrichJobWithMatch(job, match, resumeProfile) {
  let m = match
  if (!m && resumeProfile) {
    m = aiClient.localMatchJob ? aiClient.localMatchJob(resumeProfile, job) : null
  }

  if (!m) return job

  return {
    ...job,
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
    } catch (err) {
      logger.error(`Error seeding jobs: ${err.message}`)
    }
  },

  async syncRealJobs(options = {}) {
    const realJobFetcher = require('./realJobFetcher')
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
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } },
      ]
    }

    if (location && location !== 'all') {
      filter.location = { $regex: location, $options: 'i' }
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
        filter.skills = { $in: skillList.map(s => new RegExp(s, 'i')) }
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
      jobs: finalJobs,
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

      return {
        jobs: enriched.slice(0, numLimit),
        total: enriched.length,
      }
    }

    const jobs = await Job.find({ isActive: true })
      .sort({ postedAt: -1 })
      .limit(numLimit)
      .lean()

    return {
      jobs,
      total: jobs.length,
    }
  },

  async getJobById(id, userId) {
    if (mongoose.connection.readyState !== 1) {
      const samples = SAMPLE_JOBS.map((j, idx) => ({ ...j, _id: `sample-${idx + 1}` }))
      return samples.find(j => j._id === id) || samples[0]
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }

    const job = await Job.findById(id).lean()
    if (!job) return null

    if (userId) {
      const resume = await Resume.findOne({ userId }).sort({ isPrimary: -1, updatedAt: -1 }).lean()
      const match = await Match.findOne({ userId, jobId: id }).lean()
      return enrichJobWithMatch(job, match, resume?.parsedProfile)
    }

    return job
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

      const locRegexes = (user.preferences?.locations || []).filter(Boolean).map(l => new RegExp(l, 'i'))
      const locFilter = locRegexes.length
        ? {
            $or: [
              { location: { $in: locRegexes } },
              { workMode: 'Remote' },
              { location: /remote/i },
            ]
          }
        : {}

      let activeJobs = await Job.find({ isActive: true, ...locFilter }).sort({ postedAt: -1 }).limit(50)
      if (activeJobs.length < 10) {
        activeJobs = await Job.find({ isActive: true }).sort({ postedAt: -1 }).limit(50)
      }
      const threshold = user.preferences?.minMatchScore || 60
      let newHighMatches = 0

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
          { upsert: true, new: true }
        )

        if (match.matchScore >= threshold && user.preferences?.jobMatchAlerts) {
          // Check if notification already sent for this job
          const existingNotif = await notificationService.getUserNotifications(user._id, { limit: 100 })
          const alreadyNotified = existingNotif.notifications.some(n => n.data?.jobId?.toString() === job._id.toString())

          if (!alreadyNotified) {
            await notificationService.sendNotification({
              userId: user._id,
              type: 'job_match',
              title: `High Match: ${job.title} at ${job.company} (${match.matchScore}%)`,
              message: `KhojAI found a new opportunity matching your profile: ${job.title} at ${job.company} (${job.location || 'Remote'}).`,
              data: { jobId: job._id, matchScore: match.matchScore },
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
